import { makeCoreStore } from "@stackflow/core";
import {
  StackPersistenceSaveError,
  stackPersistencePlugin,
} from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { expectErrorNotToCarry } from "./__fixtures__/assertions";
import {
  advanceUntilIdle,
  settleMicrotasks,
  useDeterministicClock,
  waitForCondition,
} from "./__fixtures__/clock";
import { makeControlledStorage } from "./__fixtures__/controlledStorage";
import {
  ARTICLE_ACTIVITY,
  freshEvents,
  makeRecord,
  richSnapshot,
} from "./__fixtures__/stackFixtures";

beforeEach(() => {
  useDeterministicClock();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("storage rejection은 save 단계 오류로 개별 통지된다", () => {
  test("onSaveError는 해당 요청에 대한 StackPersistenceSaveError 하나를 받고, cause는 storage 단계와 원본 detail이며 record 전체는 오류에 없다", async () => {
    // given: save Promise가 sentinel로 reject되는 storage와 onSaveError
    const sentinel = new Error("save-failure-sentinel");
    const controlled = makeControlledStorage();
    const onSaveErrorCalls: StackPersistenceSaveError[] = [];

    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          onSaveError({ error }) {
            onSaveErrorCalls.push(error);
          },
        }),
      ],
    });
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "최초 Idle 자동 저장 요청",
    );

    // when: rejection을 해제한다
    controlled.saveCalls[0].reject(sentinel);
    await waitForCondition(
      () => onSaveErrorCalls.length >= 1,
      "save 실패의 onSaveError 통지",
    );

    // then
    expect(onSaveErrorCalls).toHaveLength(1);
    const error = onSaveErrorCalls[0];
    expect(error).toBeInstanceOf(StackPersistenceSaveError);
    expect(error).toBeInstanceOf(Error);
    expect(error.cause.kind).toBe("storage");
    expect(error.cause.detail).toBe(sentinel);
    expectErrorNotToCarry(error, [
      controlled.saveCalls[0].record,
      controlled.saveCalls[0].record.snapshot,
    ]);
  });
});

describe("save 실패는 탐색에 간섭하지 않고 다음 변경에서 보존을 재시도한다", () => {
  test("save가 실패해도 이전 navigation은 취소되지 않고 앱 actions는 계속 가능하며 다음 Idle에서 새 save 요청이 발생한다", async () => {
    // given: 첫 save가 reject된 store
    const sentinel = new Error("save-failure-sentinel");
    const controlled = makeControlledStorage();
    const onSaveErrorCalls: StackPersistenceSaveError[] = [];

    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          onSaveError({ error }) {
            onSaveErrorCalls.push(error);
          },
        }),
      ],
    });
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "최초 Idle 자동 저장 요청",
    );
    controlled.saveCalls[0].reject(sentinel);
    await waitForCondition(
      () => onSaveErrorCalls.length >= 1,
      "save 실패의 onSaveError 통지",
    );

    // when: 오류 처리 뒤 다음 navigation을 수행해 Idle에 도달한다
    store.actions.push({
      activityId: "nav-article-1",
      activityName: ARTICLE_ACTIVITY,
      activityParams: {},
    });

    // then: 이전에 확정된 탐색과 방금의 탐색 모두 유지된다
    expect(
      store.actions.getStack().activities.map((activity) => activity.id),
    ).toEqual(["fresh-home-1", "nav-article-1"]);

    await advanceUntilIdle(store.actions.getStack);
    await waitForCondition(
      () => controlled.saveCalls.length >= 2,
      "실패 후 다음 변경의 자동 저장 요청",
    );

    // then: 새 save 요청이 발생했다
    expect(controlled.saveCalls).toHaveLength(2);
  });
});

describe("실패는 각각 통지되고 뒤따르는 최신 성공이 최종 저장 상태가 된다", () => {
  test("첫 두 save가 순서대로 reject되고 세 번째가 resolve되면, 두 실패가 각각 한 번 통지되고 세 번째 record가 storage의 최종 완료 상태다", async () => {
    // given: 호출 순서대로 처리하는 storage — 실패 뒤 후속 작업 처리도 이 fixture의
    // 계약 준수(self-check)다. 전역 ordering을 plugin에 요구하지 않는다.
    const firstSentinel = new Error("save-failure-1");
    const secondSentinel = new Error("save-failure-2");
    const controlled = makeControlledStorage();
    const onSaveErrorCalls: StackPersistenceSaveError[] = [];

    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          onSaveError({ error }) {
            onSaveErrorCalls.push(error);
          },
        }),
      ],
    });

    // when: 세 번의 서로 다른 Idle snapshot을 발생시키고 순서대로 reject/reject/resolve한다
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "첫 번째 Idle 자동 저장 요청",
    );
    controlled.saveCalls[0].reject(firstSentinel);

    store.actions.push({
      activityId: "nav-article-1",
      activityName: ARTICLE_ACTIVITY,
      activityParams: {},
    });
    await advanceUntilIdle(store.actions.getStack);
    await waitForCondition(
      () => controlled.saveCalls.length >= 2,
      "두 번째 Idle 자동 저장 요청",
    );
    controlled.saveCalls[1].reject(secondSentinel);

    store.actions.stepPush({ stepId: "nav-step-2", stepParams: { page: "2" } });
    await advanceUntilIdle(store.actions.getStack);
    await waitForCondition(
      () => controlled.saveCalls.length >= 3,
      "세 번째 Idle 자동 저장 요청",
    );
    controlled.saveCalls[2].resolve();

    await waitForCondition(
      () => onSaveErrorCalls.length >= 2,
      "두 실패 각각의 onSaveError 통지",
    );

    // then: 실패별 개별 통지 — 각 통지가 해당 요청의 원본 detail을 가진다
    expect(onSaveErrorCalls).toHaveLength(2);
    expect(onSaveErrorCalls[0].cause.detail).toBe(firstSentinel);
    expect(onSaveErrorCalls[1].cause.detail).toBe(secondSentinel);

    // then: 최신 성공 record가 최종 완료 상태다
    expect(controlled.completedRecord).toBe(controlled.saveCalls[2].record);
  });
});

describe("onSaveError의 반환값은 탐색과 후속 저장에 영향을 주지 않는다", () => {
  const returnValueCases = [
    { label: "policy 객체", value: { policy: "propagate" } },
    { label: "false", value: false },
    { label: "숫자", value: 42 },
  ];

  for (const { label, value } of returnValueCases) {
    test(`handler가 ${label}를 반환해도 탐색이 유지되고 후속 save가 시도된다`, async () => {
      // given: 임의 값을 반환하는 onSaveError와 실패한 save
      const controlled = makeControlledStorage();
      let handlerCallCount = 0;

      const store = makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [
          stackPersistencePlugin({
            storage: controlled.storage,
            onSaveError() {
              handlerCallCount += 1;
              // The handler's declared return type is void; returning a
              // value anyway is exactly the runtime misuse under test.
              return value;
            },
          }),
        ],
      });
      store.init();
      await waitForCondition(
        () => controlled.saveCalls.length >= 1,
        "최초 Idle 자동 저장 요청",
      );
      controlled.saveCalls[0].reject(new Error("save-failure-sentinel"));
      await waitForCondition(
        () => handlerCallCount >= 1,
        "save 실패의 onSaveError 통지",
      );

      // when: 다음 navigation이 Idle에 도달한다
      store.actions.push({
        activityId: "nav-article-1",
        activityName: ARTICLE_ACTIVITY,
        activityParams: {},
      });
      await advanceUntilIdle(store.actions.getStack);
      await waitForCondition(
        () => controlled.saveCalls.length >= 2,
        "handler 반환값과 무관한 후속 자동 저장 요청",
      );

      // then
      expect(
        store.actions.getStack().activities.map((activity) => activity.id),
      ).toEqual(["fresh-home-1", "nav-article-1"]);
      expect(controlled.saveCalls).toHaveLength(2);
    });
  }
});

describe("save 실패 시 기존 record를 임의로 삭제하지 않는다", () => {
  test("다음 save가 실패해도 기존 완료 record는 그대로 load 가능하고 delete-like operation은 호출되지 않는다", async () => {
    // given: 기존 완료 record와 load/save 외 delete-like spy를 가진 test double
    const previousRecord = makeRecord(richSnapshot(), undefined);
    const controlled = makeControlledStorage({
      initialRecord: previousRecord,
    });
    const deleteSpy = vi.fn();
    const clearSpy = vi.fn();
    const removeSpy = vi.fn();
    const storageWithLifecycle = Object.assign(controlled.storage, {
      delete: deleteSpy,
      clear: clearSpy,
      remove: removeSpy,
    });
    const onSaveErrorCalls: StackPersistenceSaveError[] = [];

    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: storageWithLifecycle,
          onSaveError({ error }) {
            onSaveErrorCalls.push(error);
          },
        }),
      ],
    });
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "복원된 Idle의 자동 저장 요청",
    );

    // when: 다음 save가 실패한다
    controlled.saveCalls[0].reject(new Error("save-failure-sentinel"));
    await waitForCondition(
      () => onSaveErrorCalls.length >= 1,
      "save 실패의 onSaveError 통지",
    );

    // then: 기존 완료 record는 그대로 load 가능하다
    expect(controlled.completedRecord).toBe(previousRecord);
    expect(controlled.storage.load()).toBe(previousRecord);

    // then: delete-like operation이 호출되지 않았다
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
  });
});

describe("pending write를 강제 완료하거나 실행기 종료를 막지 않는다", () => {
  test("영원히 pending인 save가 있어도 flush/unload-like operation을 호출하지 않고, 완료되지 않은 record의 내구성은 주장되지 않는다", async () => {
    // given: 영원히 pending인 save와 flush/unload-like spy
    const controlled = makeControlledStorage();
    const flushSpy = vi.fn();
    const blockUnloadSpy = vi.fn();
    const disposeSpy = vi.fn();
    const storageWithLifecycle = Object.assign(controlled.storage, {
      flush: flushSpy,
      blockUnload: blockUnloadSpy,
      dispose: disposeSpy,
    });

    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: storageWithLifecycle })],
    });
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "최초 Idle 자동 저장 요청",
    );

    // when: store 사용을 끝내고 실행기 종료 경계를 모사한다 — 남은 시간과
    // microtask를 모두 소진해도 plugin이 개입할 지점이 없어야 한다
    await settleMicrotasks();
    await vi.advanceTimersByTimeAsync(5_000);

    // then: pending save는 pending 그대로다 — 강제 완료가 없다
    expect(controlled.saveCalls[0].state).toBe("pending");

    // then: flush/unload blocker 호출이 없다
    expect(flushSpy).not.toHaveBeenCalled();
    expect(blockUnloadSpy).not.toHaveBeenCalled();
    expect(disposeSpy).not.toHaveBeenCalled();

    // then: 완료되지 않은 record의 내구성은 주장되지 않는다
    expect(controlled.completedRecord).toBeNull();
  });
});
