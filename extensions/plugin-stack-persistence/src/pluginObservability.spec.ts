import { makeCoreStore } from "@stackflow/core";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { settleMicrotasks, useDeterministicClock } from "./__fixtures__/clock";
import { makeControlledStorage } from "./__fixtures__/controlledStorage";
import { makeObserverPlugin } from "./__fixtures__/observerPlugin";
import {
  freshEvents,
  invalidSchemaSnapshot,
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

describe("Snapshot 복원은 한 번의 core load 초기화다", () => {
  test("여러 Activity를 복원해도 다른 plugin은 onInit(load) 한 번을 볼 뿐, 복원 Activity 수만큼 navigation post-effect를 새로 받지 않는다", async () => {
    // given: 여러 Activity와 step 이력을 가진 snapshot, 관찰 plugin
    const controlled = makeControlledStorage({
      initialRecord: makeRecord(richSnapshot(), undefined),
    });
    const observer = makeObserverPlugin();

    // when: 복원하고 init()한다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({ storage: controlled.storage }),
        observer.plugin,
      ],
    });
    store.init();
    await settleMicrotasks();
    await vi.advanceTimersByTimeAsync(1_000);

    // then: onInit 한 번, kind는 load
    expect(observer.initCalls).toHaveLength(1);
    expect(observer.initCalls[0].kind).toBe("load");
    expect(store.actions.getStack().activities).toHaveLength(2);

    // then: 복원된 Activity/Step에 대한 사용자 navigation 이벤트 재발행이 없다
    expect(observer.postEffects).toEqual([]);
  });
});

describe("새 Stack 생성은 create로 구분된다", () => {
  const createCases = [
    {
      label: "record가 없는 시작",
      makePlugin: () =>
        stackPersistencePlugin({
          storage: makeControlledStorage().storage,
        }),
    },
    {
      label: "사용할 수 없는 record에서 recover한 시작",
      makePlugin: () =>
        stackPersistencePlugin({
          storage: makeControlledStorage({
            initialRecord: makeRecord(invalidSchemaSnapshot(), undefined),
          }).storage,
          onLoadError: () => ({ policy: "recover" }),
        }),
    },
  ];

  for (const { label, makePlugin } of createCases) {
    test(`${label}에서 observer는 initInfo.kind create를 본다 — mount 횟수나 별도 성공 callback이 필요 없다`, () => {
      // given
      const observer = makeObserverPlugin();

      // when
      const store = makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [makePlugin(), observer.plugin],
      });
      store.init();

      // then
      expect(observer.initCalls).toHaveLength(1);
      expect(observer.initCalls[0].kind).toBe("create");
      expect(store.actions.getStack().activities.map((a) => a.id)).toEqual([
        "fresh-home-1",
      ]);
    });
  }
});

describe("framework 중립 관찰 경계", () => {
  test("React 없이 core와 package만 조합해도 create와 load는 core onInit(initInfo)만으로 구분된다", () => {
    // given: React 없이 core + package만 조합한 consumer 구성 —
    // 이 스위트 전체가 node 환경에서 React 의존 없이 실행되는 것 자체가 전제다
    const createObserver = makeObserverPlugin();
    const loadObserver = makeObserverPlugin();

    // when: create와 load를 각각 실행한다
    const createStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({ storage: makeControlledStorage().storage }),
        createObserver.plugin,
      ],
    });
    createStore.init();

    const loadStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: makeControlledStorage({
            initialRecord: makeRecord(richSnapshot(), undefined),
          }).storage,
        }),
        loadObserver.plugin,
      ],
    });
    loadStore.init();

    // then: 두 경로 모두 core onInit(initInfo)로 구분 가능하다 —
    // Activity mount/useEffect 판정이나 별도 onRestored API는 필요하지 않다
    expect(createObserver.initCalls[0].kind).toBe("create");
    expect(loadObserver.initCalls[0].kind).toBe("load");
  });
});
