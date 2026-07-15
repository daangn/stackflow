import { describe, expect, test } from "vitest";
import type { CapturedAsyncError } from "./__fixtures__/isolated/childReport";
import { runIsolatedChild } from "./__fixtures__/isolatedProcess";

type CapturedMetadataError = {
  isSentinel: boolean;
  isError: boolean;
  isStackPersistenceSaveError: boolean;
};

/**
 * These contracts are about the vitest process boundary itself (unhandled
 * asynchronous errors), so they are observed in a small isolated Node
 * subprocess instead of in-process.
 */
describe("onSaveError를 생략하면 save 오류를 비동기 오류로 전파한다", () => {
  test("StackPersistenceSaveError가 같은 cause/detail로 비동기 미처리 오류 경계에 도달하고, 조용히 소비되거나 console.error로 대체되지 않으며, navigation 동기 호출은 throw하지 않는다", () => {
    // given/when: handler 없이 rejected save를 만드는 격리 subprocess
    const result = runIsolatedChild("unhandledSaveRejection.child.ts");

    // then: child가 관찰 report를 만들었다
    expect(
      result.report,
      `격리 subprocess가 report를 출력하지 못했습니다.\nstderr: ${result.stderr}\nstdout: ${result.stdout}`,
    ).not.toBeNull();
    const report = result.report as Record<string, unknown>;
    expect(report.childSetupFailed).toBeUndefined();

    // then: 오류가 비동기 미처리 오류 경계에 같은 cause/detail로 도달했다
    const rejections = report.unhandledRejections as CapturedAsyncError[];
    expect(rejections.length).toBeGreaterThanOrEqual(1);
    for (const rejection of rejections) {
      expect(rejection.isStackPersistenceSaveError).toBe(true);
      expect(rejection.isError).toBe(true);
      expect(rejection.causeKind).toBe("storage");
      expect(rejection.causeDetail).toBe(report.sentinel);
    }

    // then: 조용한 소비도 console.error 대체도 없다
    expect(report.consoleErrorCallCount).toBe(0);
    expect(report.uncaughtExceptions).toEqual([]);

    // then: navigation의 동기 호출은 throw하지 않았다
    expect(report.navigationThrewSynchronously).toBe(false);
    expect(result.status).toBe(0);
  });
});

describe("onSaveError를 제공하면 오류 처리 책임이 callback으로 이양된다", () => {
  test("callback이 실패마다 한 번 호출되고 추가 throw, unhandled rejection, 임의 console.error가 없다", () => {
    // given/when: onSaveError가 오류를 기록하는 격리 subprocess
    const result = runIsolatedChild("handledSaveRejection.child.ts");

    // then: child가 관찰 report를 만들었다
    expect(
      result.report,
      `격리 subprocess가 report를 출력하지 못했습니다.\nstderr: ${result.stderr}\nstdout: ${result.stdout}`,
    ).not.toBeNull();
    const report = result.report as Record<string, unknown>;
    expect(report.childSetupFailed).toBeUndefined();

    // then: callback이 정확히 한 번, 같은 cause/detail로 호출됐다
    const handlerCalls = report.onSaveErrorCalls as CapturedAsyncError[];
    expect(handlerCalls).toHaveLength(1);
    expect(handlerCalls[0].isStackPersistenceSaveError).toBe(true);
    expect(handlerCalls[0].causeKind).toBe("storage");
    expect(handlerCalls[0].causeDetail).toBe(report.sentinel);

    // then: 처리 책임 이양 — 그 밖의 전파 경로가 조용하다
    expect(report.unhandledRejections).toEqual([]);
    expect(report.uncaughtExceptions).toEqual([]);
    expect(report.consoleErrorCallCount).toBe(0);
    expect(result.status).toBe(0);
  });
});

describe("createMetadata 예외는 unexpected 비동기 오류로 전파한다", () => {
  test("onSaveError를 우회한 원본 값이 호출 시점과 무관한 비동기 경계에 도달하고 record 원자성과 탐색 가용성을 유지한다", () => {
    // given/when: init과 동기 step 탐색에서 metadata 생성을 실패시키는 격리 subprocess
    const result = runIsolatedChild("unhandledMetadataError.child.ts");

    // then: child가 관찰 report를 만들었다
    expect(
      result.report,
      `격리 subprocess가 report를 출력하지 못했습니다.\nstderr: ${result.stderr}\nstdout: ${result.stdout}`,
    ).not.toBeNull();
    const report = result.report as Record<string, unknown>;
    expect(report.childSetupFailed).toBeUndefined();

    // then: 두 호출 시점 모두 같은 원본 값으로 비동기 전파됐다
    const rejections = report.unhandledRejections as CapturedMetadataError[];
    expect(rejections).toHaveLength(2);
    for (const rejection of rejections) {
      expect(rejection.isSentinel).toBe(true);
      expect(rejection.isError).toBe(true);
      expect(rejection.isStackPersistenceSaveError).toBe(false);
    }

    // then: expected save 오류 callback과 storage 경계를 우회해 이전 record를 보존했다
    expect(report.onSaveErrorCallCount).toBe(0);
    expect(report.saveCallCount).toBe(0);
    expect(report.createMetadataCallCount).toBe(2);
    expect(report.completedRecordIsPrevious).toBe(true);

    // then: init과 동기 step 탐색은 unwind되지 않았고 탐색은 적용됐다
    expect(report.initThrewSynchronously).toBe(false);
    expect(report.navigationThrewSynchronously).toBe(false);
    expect(report.stepIds).toContain("metadata-error-step");
    expect(report.consoleErrorCallCount).toBe(0);
    expect(report.uncaughtExceptions).toEqual([]);
    expect(result.status).toBe(0);
  });
});
