import { makeCoreStore } from "@stackflow/core";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useDeterministicClock, waitForCondition } from "./__fixtures__/clock";
import { makeControlledStorage } from "./__fixtures__/controlledStorage";
import { makeObserverPlugin } from "./__fixtures__/observerPlugin";
import {
  freshEvents,
  invalidSchemaSnapshot,
  makeRecord,
  richSnapshot,
} from "./__fixtures__/stackFixtures";
import { makeStrategySpy } from "./__fixtures__/strategySpy";

beforeEach(() => {
  useDeterministicClock();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("shouldReuse는 core 검증보다 먼저 record 전체와 시작 맥락을 받는다", () => {
  test("거절된 snapshot은 core가 해석하지 않는다 — 손상된 snapshot이어도 오류 없이 생성되고 strategy는 원본 record와 같은 context를 동기적으로 한 번 받는다", () => {
    // given: core 검증이라면 실패할 snapshot과 false를 반환하는 strategy
    type Metadata = { origin: string };
    const record = makeRecord(invalidSchemaSnapshot(), {
      origin: "m-identifiable",
    });
    const initialContext = { entry: "deep-link" };
    const controlled = makeControlledStorage<Metadata>({
      initialRecord: record,
    });
    const strategy = makeStrategySpy<Metadata>({
      createMetadata: () => ({ origin: "m-next" }),
      shouldReuse: () => false,
    });
    const onLoadError = vi.fn(() => ({ policy: "recover" as const }));

    // when: store를 생성한다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      initialContext,
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          strategy: strategy.strategy,
          onLoadError,
        }),
      ],
    });

    // then: 생성이 끝난 시점에 이미 호출됐다 — 동기 계약
    expect(strategy.shouldReuseCalls).toHaveLength(1);
    expect(strategy.shouldReuseCalls[0].record).toBe(record);
    expect(strategy.shouldReuseCalls[0].initialContext).toBe(initialContext);

    // then: core SnapshotLoadError도 onLoadError도 발생하지 않았다
    expect(onLoadError).not.toHaveBeenCalled();
    expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
      "fresh-home-1",
    ]);
  });
});

describe("정상적인 비재사용은 오류 없이 새 탐색 연속성을 시작한다", () => {
  test("사용 가능한 record여도 shouldReuse가 false면 onLoadError 없이 fresh Stack(create)이 되고, fresh snapshot record의 저장 요청이 기존 record를 대체할 수 있다", async () => {
    // given: 사용 가능한 기존 record와 false를 반환하는 strategy
    type Metadata = { origin: string };
    const existingRecord = makeRecord(richSnapshot(), { origin: "m-old" });
    const controlled = makeControlledStorage<Metadata>({
      initialRecord: existingRecord,
    });
    const strategy = makeStrategySpy<Metadata>({
      createMetadata: () => ({ origin: "m-new" }),
      shouldReuse: () => false,
    });
    const onLoadError = vi.fn(() => ({ policy: "recover" as const }));
    const observer = makeObserverPlugin();

    // when: store가 create되어 최초 Idle에 도달한다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          strategy: strategy.strategy,
          onLoadError,
        }),
        observer.plugin,
      ],
    });
    store.init();

    // then: 오류가 아니라 정상 create다
    expect(onLoadError).not.toHaveBeenCalled();
    expect(observer.initCalls[0].kind).toBe("create");
    expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
      "fresh-home-1",
    ]);

    // then: fresh snapshot의 저장 요청이 발생해 기존 record를 대체할 수 있다
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "fresh Idle Stack의 자동 저장 요청",
    );
    const saved = controlled.saveCalls[0].record;
    const savedIds = saved.snapshot.events.map((event) => event.id);
    expect(savedIds).toContain("fresh-push-home");
    expect(savedIds).not.toContain("rich-push-home");

    controlled.saveCalls[0].resolve();
    expect(controlled.completedRecord).toBe(saved);
  });
});

describe("load 판단 단계는 shouldReuse만 호출한다", () => {
  test("init() 전의 store 생성은 storage.load → shouldReuse 순서로 각각 한 번이며 createMetadata는 호출되지 않는다", () => {
    // given: 유효 record와 호출 순서를 기록하는 storage/strategy, createMetadata trap
    type Metadata = { origin: string };
    const callLog: string[] = [];
    const controlled = makeControlledStorage<Metadata>({
      initialRecord: makeRecord(richSnapshot(), { origin: "m-1" }),
      callLog,
    });
    const strategy = makeStrategySpy<Metadata>({
      callLog,
      createMetadata: "forbidden",
      shouldReuse: () => true,
    });

    // when: store 생성으로 동기 load와 reuse 판단만 끝낸다 (init() 없음)
    makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          strategy: strategy.strategy,
        }),
      ],
    });

    // then: 호출 순서와 횟수가 정확히 load 판단 단계만 나타낸다
    expect(callLog).toEqual(["storage.load", "strategy.shouldReuse"]);
    expect(strategy.shouldReuseCalls).toHaveLength(1);
    expect(strategy.createMetadataCalls).toHaveLength(0);
  });
});
