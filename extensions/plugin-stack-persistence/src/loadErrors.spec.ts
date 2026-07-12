import { makeCoreStore, SnapshotLoadError } from "@stackflow/core";
import {
  StackPersistenceLoadError,
  stackPersistencePlugin,
} from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { expectErrorNotToCarry } from "./__fixtures__/assertions";
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
  error: StackPersistenceLoadError | SnapshotLoadError;
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

describe("storage 읽기 실패는 storage 단계의 load 오류다", () => {
  test("onLoadError를 생략하면 기본 recover로 fresh Stack이 만들어지고 생성은 throw하지 않으며 임의 console.error가 없다", () => {
    // given: load()가 sentinel을 throw하고 handler를 생략한 storage
    const sentinel = new Error("load-failure-sentinel");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const controlled = makeControlledStorage({ loadError: sentinel });
    const observer = makeObserverPlugin();

    // when: store를 생성하고 init()한다 — 여기서 throw하면 테스트가 실패한다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({ storage: controlled.storage }),
        observer.plugin,
      ],
    });
    store.init();

    // then: 기본 정책 recover
    expect(observer.initCalls[0].kind).toBe("create");
    expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
      "fresh-home-1",
    ]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("onLoadError는 cause.kind storage와 원본 detail, 같은 initialContext를 가진 StackPersistenceLoadError를 받고 오류에 실패 record가 없다", () => {
    // given: load() throw sentinel과 오류를 기록하는 handler
    const sentinel = new Error("load-failure-sentinel");
    const initialContext = { entry: "home" };
    const controlled = makeControlledStorage({ loadError: sentinel });
    let received: LoadErrorObservation | undefined;

    // when: store를 생성한다
    makeCoreStore({
      initialEvents: freshEvents(),
      initialContext,
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          onLoadError(args) {
            received = args;
            return { policy: "recover" };
          },
        }),
      ],
    });

    // then: 오류 정체와 단계 표시
    expect(received).toBeDefined();
    expect(received?.error).toBeInstanceOf(StackPersistenceLoadError);
    expect(received?.error).toBeInstanceOf(Error);

    const error = received?.error as StackPersistenceLoadError;
    expect(error.cause.kind).toBe("storage");
    expect(error.cause.detail).toBe(sentinel);
    expect(received?.initialContext).toBe(initialContext);

    // then: 실패 record를 담는 property가 없다
    expect("record" in error).toBe(false);
    expect("snapshot" in error).toBe(false);
  });
});

describe("shouldReuse 예외는 strategy 단계의 load 오류다", () => {
  test("onLoadError는 cause.kind strategy와 원본 detail·context를 받고, recover가 실패 record 없이 fresh Stack으로 복구한다", () => {
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
    let received: LoadErrorObservation | undefined;

    // when: onLoadError가 recover를 반환한다
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
      ],
    });

    // then: strategy 단계 표시와 원본 detail·context
    expect(received?.error).toBeInstanceOf(StackPersistenceLoadError);
    const error = received?.error as StackPersistenceLoadError;
    expect(error.cause.kind).toBe("strategy");
    expect(error.cause.detail).toBe(sentinel);
    expect(received?.initialContext).toBe(initialContext);

    // then: 오류가 실패 record 전체를 담지 않은 채 fresh Stack으로 복구한다
    expectErrorNotToCarry(error, [record, record.snapshot]);
    expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
      "fresh-home-1",
    ]);
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
      expect(received?.error).not.toBeInstanceOf(StackPersistenceLoadError);
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

describe("persistence load 오류의 propagate는 같은 오류 객체를 전파한다", () => {
  test("storage 단계 오류를 propagate하면 호출부가 잡은 객체는 callback이 받은 StackPersistenceLoadError와 동일하다", () => {
    // given: load() throw와 propagate handler
    const sentinel = new Error("load-failure-sentinel");
    const controlled = makeControlledStorage({ loadError: sentinel });
    let received: unknown;

    // when/then: store 생성이 같은 객체로 throw한다
    let caught: unknown;
    try {
      makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [
          stackPersistencePlugin({
            storage: controlled.storage,
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
    expect(caught).toBeInstanceOf(StackPersistenceLoadError);
    expect((caught as StackPersistenceLoadError).cause.kind).toBe("storage");
    expect((caught as StackPersistenceLoadError).cause.detail).toBe(sentinel);
  });

  test("strategy 단계 오류를 propagate하면 호출부가 잡은 객체는 callback이 받은 StackPersistenceLoadError와 동일하다", () => {
    // given: shouldReuse throw와 propagate handler
    const sentinel = new Error("reuse-evaluation-sentinel");
    const controlled = makeControlledStorage<Metadata>({
      initialRecord: makeRecord(richSnapshot(), { origin: "m-1" }),
    });
    const strategy = makeStrategySpy<Metadata>({
      createMetadata: () => ({ origin: "m-next" }),
      shouldReuse: () => {
        throw sentinel;
      },
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
    expect(caught).toBeInstanceOf(StackPersistenceLoadError);
    expect((caught as StackPersistenceLoadError).cause.kind).toBe("strategy");
    expect((caught as StackPersistenceLoadError).cause.detail).toBe(sentinel);
  });
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

describe("명시적 recover는 오류별로 fresh create를 정확히 한 번 수행한다", () => {
  type RecoverCase = {
    label: string;
    expectedShouldReuseCalls: number;
    setup: (onLoadError: () => { policy: "recover" }) => {
      plugin: ReturnType<typeof stackPersistencePlugin>;
      loadCallCount: () => number;
      shouldReuseCallCount: () => number;
    };
  };

  const recoverCases: RecoverCase[] = [
    {
      label: "storage 읽기 실패",
      expectedShouldReuseCalls: 0,
      setup: (onLoadError) => {
        const controlled = makeControlledStorage({
          loadError: new Error("load-failure-sentinel"),
        });
        return {
          plugin: stackPersistencePlugin({
            storage: controlled.storage,
            onLoadError,
          }),
          loadCallCount: () => controlled.loadCallCount,
          shouldReuseCallCount: () => 0,
        };
      },
    },
    {
      label: "strategy 평가 실패",
      expectedShouldReuseCalls: 1,
      setup: (onLoadError) => {
        const controlled = makeControlledStorage<Metadata>({
          initialRecord: makeRecord(richSnapshot(), { origin: "m-1" }),
        });
        const strategy = makeStrategySpy<Metadata>({
          createMetadata: () => ({ origin: "m-next" }),
          shouldReuse: () => {
            throw new Error("reuse-evaluation-sentinel");
          },
        });
        return {
          plugin: stackPersistencePlugin({
            storage: controlled.storage,
            strategy: strategy.strategy,
            onLoadError,
          }),
          loadCallCount: () => controlled.loadCallCount,
          shouldReuseCallCount: () => strategy.shouldReuseCalls.length,
        };
      },
    },
    {
      label: "core 검증 실패",
      expectedShouldReuseCalls: 1,
      setup: (onLoadError) => {
        const controlled = makeControlledStorage<Metadata>({
          initialRecord: makeRecord(invalidSchemaSnapshot(), {
            origin: "m-1",
          }),
        });
        const strategy = makeStrategySpy<Metadata>({
          createMetadata: () => ({ origin: "m-next" }),
          shouldReuse: () => true,
        });
        return {
          plugin: stackPersistencePlugin({
            storage: controlled.storage,
            strategy: strategy.strategy,
            onLoadError,
          }),
          loadCallCount: () => controlled.loadCallCount,
          shouldReuseCallCount: () => strategy.shouldReuseCalls.length,
        };
      },
    },
  ];

  for (const { label, expectedShouldReuseCalls, setup } of recoverCases) {
    test(`${label}에서 recover하면 load/reuse 평가를 다시 poll하지 않고 fresh create와 initInfo.kind create가 한 번씩이다`, () => {
      // given
      const onLoadError = vi.fn(() => ({ policy: "recover" as const }));
      const observed = setup(onLoadError);
      const observer = makeObserverPlugin();

      // when
      const store = makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [observed.plugin, observer.plugin],
      });
      store.init();

      // then: 재조회 없음, create 한 번
      expect(onLoadError).toHaveBeenCalledTimes(1);
      expect(observed.loadCallCount()).toBe(1);
      expect(observed.shouldReuseCallCount()).toBe(expectedShouldReuseCalls);
      expect(observer.initCalls).toHaveLength(1);
      expect(observer.initCalls[0].kind).toBe("create");
      expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
        "fresh-home-1",
      ]);
    });
  }
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

describe("onLoadError 생략의 기본 recover는 모든 예상 load 단계에 동일 적용된다", () => {
  const omittedHandlerCases = [
    {
      label: "storage 읽기 실패",
      makePlugin: () =>
        stackPersistencePlugin({
          storage: makeControlledStorage({
            loadError: new Error("load-failure-sentinel"),
          }).storage,
        }),
    },
    {
      label: "shouldReuse 예외",
      makePlugin: () =>
        stackPersistencePlugin({
          storage: makeControlledStorage<Metadata>({
            initialRecord: makeRecord(richSnapshot(), { origin: "m-1" }),
          }).storage,
          strategy: makeStrategySpy<Metadata>({
            createMetadata: () => ({ origin: "m-next" }),
            shouldReuse: () => {
              throw new Error("reuse-evaluation-sentinel");
            },
          }).strategy,
        }),
    },
    {
      label: "core 검증 실패",
      makePlugin: () =>
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
    },
  ] as const;

  for (const { label, makePlugin } of omittedHandlerCases) {
    test(`${label}에서 handler가 없으면 오류를 동기 전파하거나 console.error로 대신하지 않고 fresh Stack(create)으로 recover한다`, () => {
      // given
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const observer = makeObserverPlugin();

      // when: 생성과 init이 throw 없이 끝난다 — throw하면 테스트가 실패한다
      const store = makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [makePlugin(), observer.plugin],
      });
      store.init();

      // then
      expect(observer.initCalls[0].kind).toBe("create");
      expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
        "fresh-home-1",
      ]);
      expect(consoleError).not.toHaveBeenCalled();
    });
  }
});
