import { makeCoreStore } from "@stackflow/core";
import type { StackSnapshotRecord } from "@stackflow/plugin-stack-persistence";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { logicalStackView } from "./__fixtures__/assertions";
import { settleMicrotasks, useDeterministicClock } from "./__fixtures__/clock";
import { makeControlledStorage } from "./__fixtures__/controlledStorage";
import { makeObserverPlugin } from "./__fixtures__/observerPlugin";
import {
  deepFreeze,
  freshEvents,
  makeRecord,
  pausedSnapshot,
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

describe("저장된 record가 없으면 새 Stack을 정상 create한다", () => {
  test("load()가 null이면 fresh initial Stack이 최초 상태이고 initInfo.kind는 create이며, 생성 중 load 한 번 이후 비동기 교체가 없다", async () => {
    // given: 동기적으로 null을 반환하는 storage와 고정 initialContext
    const initialContext = { entry: "home" };
    const controlled = makeControlledStorage();
    const observer = makeObserverPlugin();

    // when: store를 만들고 init()한다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      initialContext,
      plugins: [
        stackPersistencePlugin({ storage: controlled.storage }),
        observer.plugin,
      ],
    });

    // then: load는 생성 중 정확히 한 번 호출됐다
    expect(controlled.loadCallCount).toBe(1);

    const initialView = logicalStackView(store.actions.getStack());
    expect(initialView.activities.map((a) => a.id)).toEqual(["fresh-home-1"]);
    expect(initialView.activities[0].name).toBe("Home");

    store.init();
    expect(observer.initCalls).toHaveLength(1);
    expect(observer.initCalls[0].kind).toBe("create");

    // then: 이후 비동기 교체가 없다 — 시간이 지나도 같은 Stack, 추가 load 없음
    await settleMicrotasks();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(logicalStackView(store.actions.getStack())).toEqual(initialView);
    expect(controlled.loadCallCount).toBe(1);
  });
});

describe("strategy 없는 유효 record는 최초 상태부터 복원된 Stack이다", () => {
  test("fresh Stack이 잠정 노출되지 않고 처음 읽은 상태가 복원 상태이며 initInfo.kind는 load다", () => {
    // given: richSnapshot과 metadata: undefined record, strategy 없음
    const record = makeRecord(richSnapshot(), undefined);
    const controlled = makeControlledStorage({ initialRecord: record });
    const observer = makeObserverPlugin();

    // when: store를 만들고 최초 getStack()을 읽은 뒤 init()한다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({ storage: controlled.storage }),
        observer.plugin,
      ],
    });
    const firstRead = store.actions.getStack();
    store.init();

    // then: 처음 읽은 상태가 이미 복원 상태다 — fresh seed가 잠정 노출된 적 없음
    expect(firstRead.activities.map((a) => a.id)).toEqual([
      "rich-home-1",
      "rich-article-1",
    ]);
    expect(firstRead.activities.map((a) => a.name)).toEqual([
      "Home",
      "Article",
    ]);
    expect(observer.initCalls[0].kind).toBe("load");
  });
});

describe("plugin은 record envelope와 paused snapshot에 추가 검증·정규화를 하지 않는다", () => {
  test("strategy가 이해하는 opaque metadata와 추가 envelope property를 가진 record를 그대로 보고, core가 받아들이는 paused snapshot은 paused 상태 그대로 복원된다", () => {
    // given: opaque metadata + 계약 밖 추가 envelope property + paused snapshot
    type OpaqueMetadata = { opaque: { tag: string } };
    const record = deepFreeze({
      snapshot: pausedSnapshot(),
      metadata: { opaque: { tag: "m-1" } },
      vendorExtension: "extra-envelope-value",
    }) as StackSnapshotRecord<OpaqueMetadata> & { vendorExtension: string };

    const controlled = makeControlledStorage<OpaqueMetadata>({
      initialRecord: record,
    });
    const strategy = makeStrategySpy<OpaqueMetadata>({
      createMetadata: () => ({ opaque: { tag: "m-next" } }),
      shouldReuse: () => true,
    });

    // when: shouldReuse: true로 load한다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          strategy: strategy.strategy,
        }),
      ],
    });

    // then: strategy는 추가 property까지 포함한 record를 참조 그대로 본다
    expect(strategy.shouldReuseCalls).toHaveLength(1);
    expect(strategy.shouldReuseCalls[0].record).toBe(record);

    // then: paused 상태가 그대로 복원된다 — Idle 여부는 load의 전제조건이 아니다
    const stack = store.actions.getStack();
    expect(stack.globalTransitionState).toBe("paused");
    expect(stack.activities.map((a) => a.id)).toEqual(["paused-home-1"]);
  });
});

describe("plugin 존재·순서는 재사용 판단을 암묵적으로 바꾸지 않는다", () => {
  test("history-like observer가 persistence 앞에 있든 뒤에 있든 shouldReuse 입력·결정·최초 복원 Stack이 동일하다", () => {
    // given: 두 조합이 공유하는 같은 record/context/strategy 로직
    const sharedRecord = makeRecord(richSnapshot(), { origin: "m-shared" });
    const sharedContext = deepFreeze({ url: "/articles/a-1" });

    const run = (order: "observer-first" | "persistence-first") => {
      const controlled = makeControlledStorage({
        initialRecord: sharedRecord,
      });
      const strategy = makeStrategySpy<{ origin: string }>({
        createMetadata: () => ({ origin: "m-next" }),
        shouldReuse: () => true,
      });
      const observer = makeObserverPlugin("history-like-observer");
      const persistence = stackPersistencePlugin({
        storage: controlled.storage,
        strategy: strategy.strategy,
      });

      const store = makeCoreStore({
        initialEvents: freshEvents(),
        initialContext: sharedContext,
        plugins:
          order === "observer-first"
            ? [observer.plugin, persistence]
            : [persistence, observer.plugin],
      });

      return {
        shouldReuseCall: strategy.shouldReuseCalls[0],
        view: logicalStackView(store.actions.getStack()),
      };
    };

    // when: 두 plugin 순서로 각각 시작한다
    const observerFirst = run("observer-first");
    const persistenceFirst = run("persistence-first");

    // then: shouldReuse가 받은 입력이 동일한 참조이고 결정·복원 Stack도 같다
    expect(observerFirst.shouldReuseCall.record).toBe(sharedRecord);
    expect(persistenceFirst.shouldReuseCall.record).toBe(sharedRecord);
    expect(observerFirst.shouldReuseCall.initialContext).toBe(sharedContext);
    expect(persistenceFirst.shouldReuseCall.initialContext).toBe(sharedContext);
    expect(persistenceFirst.view).toEqual(observerFirst.view);
    expect(
      observerFirst.view.activities.map((activity) => activity.id),
    ).toEqual(["rich-home-1", "rich-article-1"]);
  });
});

describe("reuse된 snapshot은 전체 Stack의 진실이며 fresh 진입과 병합되지 않는다", () => {
  test("최초 상태는 snapshot의 Activity/Step 이력만 반영하고, 뒤따르는 history-like observer는 복원 Stack을 onInit(load)의 기준 상태로 본다", () => {
    // given: richSnapshot record와 서로 다른 fresh initialActivity seed
    const snapshot = richSnapshot();
    const controlled = makeControlledStorage({
      initialRecord: makeRecord(snapshot, undefined),
    });
    const observer = makeObserverPlugin("history-like-observer");

    // when: persistence 뒤에 observer를 두고 시작한다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({ storage: controlled.storage }),
        observer.plugin,
      ],
    });
    store.init();

    // then: 최초 상태는 snapshot 이력 그대로이고 fresh 진입 event는 섞이지 않았다
    const capturedIds = store.actions
      .captureSnapshot()
      .events.map((event) => event.id);
    expect(capturedIds).toEqual(snapshot.events.map((event) => event.id));
    expect(capturedIds).not.toContain("fresh-push-home");

    // then: observer는 복원 Stack을 load 초기화의 기준 상태로 본다
    expect(observer.initCalls[0].kind).toBe("load");
    expect(logicalStackView(observer.initCalls[0].stackAtInit)).toEqual(
      logicalStackView(store.actions.getStack()),
    );
  });
});
