import { makeCoreStore, SnapshotLoadError } from "@stackflow/core";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  expectErrorNotToCarry,
  navigationOrderIds,
} from "./__fixtures__/assertions";
import { useDeterministicClock } from "./__fixtures__/clock";
import { makeControlledStorage } from "./__fixtures__/controlledStorage";
import { makeObserverPlugin } from "./__fixtures__/observerPlugin";
import {
  freshEvents,
  invalidSchemaSnapshot,
  makeRecord,
  richSnapshot,
  unregisteredActivitySnapshot,
} from "./__fixtures__/stackFixtures";
import { makeStrategySpy } from "./__fixtures__/strategySpy";

type Metadata = { origin: string };

type LoadErrorObservation = {
  error: SnapshotLoadError;
  initialContext: unknown;
};

beforeEach(() => {
  useDeterministicClock();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("storage 읽기 실패는 전용 복구 핸들러가 처리한다", () => {
  test("onStorageLoadError를 생략하면 onLoadError로 우회하지 않고 원본 오류가 Stack 생성 밖으로 전파된다", () => {
    const sentinel = new Error("load-failure-sentinel");
    const controlled = makeControlledStorage({ loadError: sentinel });
    const onLoadError = vi.fn(() => ({ policy: "recover" as const }));

    let caught: unknown;
    try {
      makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [
          stackPersistencePlugin({
            storage: controlled.storage,
            onLoadError,
          }),
        ],
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBe(sentinel);
    expect(onLoadError).not.toHaveBeenCalled();
    expect(controlled.loadCallCount).toBe(1);
    expect(controlled.saveCalls).toHaveLength(0);
  });

  test("onStorageLoadError가 null을 반환하면 원본 오류와 initialContext를 관찰하고 fresh Stack을 만든다", () => {
    const sentinel = new Error("load-failure-sentinel");
    const initialContext = { entry: "home" };
    const controlled = makeControlledStorage({ loadError: sentinel });
    const observer = makeObserverPlugin();
    const onLoadError = vi.fn(() => ({ policy: "recover" as const }));
    let received: { error: unknown; initialContext: unknown } | undefined;

    const store = makeCoreStore({
      initialEvents: freshEvents(),
      initialContext,
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          onStorageLoadError(args) {
            received = args;
            return null;
          },
          onLoadError,
        }),
        observer.plugin,
      ],
    });
    store.init();

    expect(received?.error).toBe(sentinel);
    expect(received?.initialContext).toBe(initialContext);
    expect(onLoadError).not.toHaveBeenCalled();
    expect(observer.initCalls[0].kind).toBe("create");
    expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
      "fresh-home-1",
    ]);
  });

  test("onStorageLoadError가 record를 반환하면 정상 load와 동일하게 reuse 판단과 core 복원을 거친다", () => {
    const sentinel = new Error("primary-load-failure");
    const initialContext = { entry: "fallback" };
    const fallbackRecord = makeRecord(richSnapshot(), { origin: "fallback" });
    const controlled = makeControlledStorage<Metadata>({
      loadError: sentinel,
    });
    const strategy = makeStrategySpy<Metadata>({
      createMetadata: () => ({ origin: "next" }),
      shouldReuse: () => true,
    });
    const observer = makeObserverPlugin();

    const store = makeCoreStore({
      initialEvents: freshEvents(),
      initialContext,
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          strategy: strategy.strategy,
          onStorageLoadError({ error, initialContext: receivedContext }) {
            expect(error).toBe(sentinel);
            expect(receivedContext).toBe(initialContext);
            return fallbackRecord;
          },
        }),
        observer.plugin,
      ],
    });
    store.init();

    expect(strategy.shouldReuseCalls).toEqual([
      { record: fallbackRecord, initialContext },
    ]);
    expect(observer.initCalls[0].kind).toBe("load");
    expect(navigationOrderIds(store.actions.getStack())).toEqual([
      "rich-home-1",
      "rich-article-1",
    ]);
  });

  test("onStorageLoadError가 받은 오류를 throw하면 같은 객체가 Stack 생성 밖으로 전파된다", () => {
    const sentinel = new Error("load-failure-sentinel");
    const controlled = makeControlledStorage({ loadError: sentinel });

    let caught: unknown;
    try {
      makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [
          stackPersistencePlugin({
            storage: controlled.storage,
            onStorageLoadError({ error }) {
              throw error;
            },
          }),
        ],
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBe(sentinel);
  });
});

describe("shouldReuse 예외는 unexpected 오류다", () => {
  test("load handler로 정규화하지 않고 원본 오류를 Stack 생성 밖으로 전파한다", () => {
    // given: load는 성공하지만 shouldReuse가 sentinel을 throw하는 strategy
    const sentinel = new Error("reuse-evaluation-sentinel");
    const initialContext = { entry: "home" };
    const record = makeRecord(richSnapshot(), { origin: "m-1" });
    const controlled = makeControlledStorage<Metadata>({
      initialRecord: record,
    });
    const strategy = makeStrategySpy<Metadata>({
      createMetadata: () => ({ origin: "m-next" }),
      shouldReuse: () => {
        throw sentinel;
      },
    });
    const onLoadError = vi.fn(() => ({ policy: "recover" as const }));

    // when
    let caught: unknown;
    try {
      makeCoreStore({
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
    } catch (error) {
      caught = error;
    }

    // then
    expect(caught).toBe(sentinel);
    expect(onLoadError).not.toHaveBeenCalled();
    expect(controlled.loadCallCount).toBe(1);
    expect(controlled.saveCalls).toHaveLength(0);
    expect(strategy.shouldReuseCalls).toEqual([{ record, initialContext }]);
  });
});

describe("core 검증 오류는 wrapper 없이 원본 SnapshotLoadError로 전달된다", () => {
  const coreInvalidCases = [
    {
      label: "손상된 schema",
      snapshot: invalidSchemaSnapshot,
      expectedCauseKind: "unrecognized-snapshot",
    },
    {
      label: "미등록 Activity",
      snapshot: unregisteredActivitySnapshot,
      expectedCauseKind: "incompatible-events",
    },
  ] as const;

  for (const { label, snapshot, expectedCauseKind } of coreInvalidCases) {
    test(`${label} snapshot의 onLoadError는 core가 만든 SnapshotLoadError 인스턴스를 그대로 받고, initialContext는 strategy가 본 객체 및 store 원본과 동일 참조다`, () => {
      // given: shouldReuse: true와 identity를 구별할 수 있는 context 객체
      const initialContext = { marker: "context-identity" };
      const record = makeRecord(snapshot(), { origin: "m-1" });
      const controlled = makeControlledStorage<Metadata>({
        initialRecord: record,
      });
      const strategy = makeStrategySpy<Metadata>({
        createMetadata: () => ({ origin: "m-next" }),
        shouldReuse: () => true,
      });
      const observer = makeObserverPlugin();
      let received: LoadErrorObservation | undefined;

      // when: core가 적용 대상으로 선택된 snapshot을 검증하고 onLoadError가 recover한다
      const store = makeCoreStore({
        initialEvents: freshEvents(),
        initialContext,
        plugins: [
          stackPersistencePlugin({
            storage: controlled.storage,
            strategy: strategy.strategy,
            onLoadError(args) {
              received = args;
              return { policy: "recover" };
            },
          }),
          observer.plugin,
        ],
      });
      store.init();

      // then: wrapper가 아닌 core의 원본 오류 객체다
      expect(received?.error).toBeInstanceOf(SnapshotLoadError);
      expect((received?.error as SnapshotLoadError).cause.kind).toBe(
        expectedCauseKind,
      );

      // then: context는 strategy 경계에서 관찰한 객체 및 store 원본과 strict-equal이다
      expect(received?.initialContext).toBe(initialContext);
      expect(strategy.shouldReuseCalls[0].initialContext).toBe(initialContext);

      // then: 실패 record를 덧붙이지 않은 채 fresh Stack으로 복구한다
      expect("record" in (received?.error as object)).toBe(false);
      expectErrorNotToCarry(received?.error, [record, record.snapshot]);
      expect(observer.initCalls[0].kind).toBe("create");
      expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
        "fresh-home-1",
      ]);
    });
  }
});

describe("core load 오류의 propagate는 원본 SnapshotLoadError를 전파한다", () => {
  test("호출부가 잡은 객체는 callback이 받은 core SnapshotLoadError와 동일하다", () => {
    // given: core 검증에 실패하는 snapshot과 propagate handler
    const controlled = makeControlledStorage<Metadata>({
      initialRecord: makeRecord(invalidSchemaSnapshot(), { origin: "m-1" }),
    });
    const strategy = makeStrategySpy<Metadata>({
      createMetadata: () => ({ origin: "m-next" }),
      shouldReuse: () => true,
    });
    let received: unknown;

    // when/then
    let caught: unknown;
    try {
      makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [
          stackPersistencePlugin({
            storage: controlled.storage,
            strategy: strategy.strategy,
            onLoadError({ error }) {
              received = error;
              return { policy: "propagate" };
            },
          }),
        ],
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeDefined();
    expect(caught).toBe(received);
    expect(caught).toBeInstanceOf(SnapshotLoadError);
  });
});

describe("core SnapshotLoadError의 명시적 recover는 fresh create를 정확히 한 번 수행한다", () => {
  test("recover하면 load/reuse 평가를 다시 poll하지 않고 fresh create와 initInfo.kind create가 한 번씩이다", () => {
    // given
    const controlled = makeControlledStorage<Metadata>({
      initialRecord: makeRecord(invalidSchemaSnapshot(), { origin: "m-1" }),
    });
    const strategy = makeStrategySpy<Metadata>({
      createMetadata: () => ({ origin: "m-next" }),
      shouldReuse: () => true,
    });
    const onLoadError = vi.fn(() => ({ policy: "recover" as const }));
    const observer = makeObserverPlugin();

    // when
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

    // then
    expect(onLoadError).toHaveBeenCalledTimes(1);
    expect(controlled.loadCallCount).toBe(1);
    expect(strategy.shouldReuseCalls).toHaveLength(1);
    expect(observer.initCalls).toHaveLength(1);
    expect(observer.initCalls[0].kind).toBe("create");
    expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
      "fresh-home-1",
    ]);
  });
});

describe("schema/Activity 비호환은 migration 없이 오류 정책으로 처리된다", () => {
  const incompatibleCases = [
    { label: "알 수 없는 $schema", snapshot: invalidSchemaSnapshot },
    {
      label: "현재 config에 없는 Activity",
      snapshot: unregisteredActivitySnapshot,
    },
  ] as const;

  for (const { label, snapshot } of incompatibleCases) {
    test(`${label} snapshot은 core SnapshotLoadError 정책으로 들어가고, 변환하거나 재저장한 뒤 재시도하지 않는다`, () => {
      // given: 비호환 snapshot record와 shouldReuse: true (record fixture는 frozen —
      // 어느 계층이든 변환을 시도하면 그 자리에서 throw로 드러난다)
      const record = makeRecord(snapshot(), { origin: "m-1" });
      const controlled = makeControlledStorage<Metadata>({
        initialRecord: record,
      });
      const strategy = makeStrategySpy<Metadata>({
        createMetadata: () => ({ origin: "m-next" }),
        shouldReuse: () => true,
      });
      const receivedErrors: unknown[] = [];

      // when: store를 생성한다 (init 전 — load 단계만)
      makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [
          stackPersistencePlugin({
            storage: controlled.storage,
            strategy: strategy.strategy,
            onLoadError({ error }) {
              receivedErrors.push(error);
              return { policy: "recover" };
            },
          }),
        ],
      });

      // then: core 오류 정책으로 정확히 한 번 들어갔다
      expect(receivedErrors).toHaveLength(1);
      expect(receivedErrors[0]).toBeInstanceOf(SnapshotLoadError);

      // then: migration 시도 없음 — 재조회·재저장·재평가가 없다
      expect(controlled.loadCallCount).toBe(1);
      expect(controlled.saveCalls).toHaveLength(0);
      expect(strategy.shouldReuseCalls).toHaveLength(1);
    });
  }
});

describe("onLoadError 생략의 기본 recover는 core 검증 오류에 적용된다", () => {
  test("core 검증 실패에서 handler가 없으면 fresh Stack으로 recover한다", () => {
    // given
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const observer = makeObserverPlugin();

    // when
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: makeControlledStorage<Metadata>({
            initialRecord: makeRecord(invalidSchemaSnapshot(), {
              origin: "m-1",
            }),
          }).storage,
          strategy: makeStrategySpy<Metadata>({
            createMetadata: () => ({ origin: "m-next" }),
            shouldReuse: () => true,
          }).strategy,
        }),
        observer.plugin,
      ],
    });
    store.init();

    // then
    expect(observer.initCalls[0].kind).toBe("create");
    expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
      "fresh-home-1",
    ]);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
