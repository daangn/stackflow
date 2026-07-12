import type { StackflowActions } from "@stackflow/core";
import { makeCoreStore } from "@stackflow/core";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  logicalStackView,
  navigationOrderIds,
} from "./__fixtures__/assertions";
import {
  advanceUntilIdle,
  settleMicrotasks,
  useDeterministicClock,
  waitForCondition,
} from "./__fixtures__/clock";
import { makeControlledStorage } from "./__fixtures__/controlledStorage";
import { makeObserverPlugin } from "./__fixtures__/observerPlugin";
import {
  ARTICLE_ACTIVITY,
  freshEvents,
  invalidSchemaSnapshot,
  makeRecord,
  pausedSnapshot,
  richSnapshot,
  twoActivityEvents,
  withStepEvents,
} from "./__fixtures__/stackFixtures";

beforeEach(() => {
  useDeterministicClock();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("새로 생성한 최초 Idle Stack을 자동 보존의 기준점으로 저장한다", () => {
  test("record 없는 시작에서 소비자 수동 호출 없이 최초 Idle snapshot의 저장 요청이 정확히 한 번 발생하고, strategy 없는 record의 metadata는 own property이자 strict undefined다", async () => {
    // given: record 없는 storage와 fresh Idle Stack
    const controlled = makeControlledStorage();
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });
    expect(store.actions.getStack().globalTransitionState).toBe("idle");

    // when: init() 이후 아무 수동 호출도 하지 않는다
    store.init();

    // then: 정확히 그 core snapshot의 저장 요청이 한 번 발생한다
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "최초 Idle 자동 저장 요청",
    );
    await settleMicrotasks();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(controlled.saveCalls).toHaveLength(1);

    const record = controlled.saveCalls[0].record;
    expect(record.snapshot).toEqual(store.actions.captureSnapshot());

    // then: strategy 없는 mode의 metadata 계약
    expect(Object.hasOwn(record, "metadata")).toBe(true);
    expect(record.metadata).toBe(undefined);
  });
});

describe("복원된 최초 Idle Stack도 자동 보존의 기준점으로 저장한다", () => {
  test("unpaused Idle snapshot을 load한 뒤 init()하면 복원된 최초 Idle snapshot의 저장 요청이 발생한다", async () => {
    // given: richSnapshot을 성공적으로 load한 store
    const snapshot = richSnapshot();
    const controlled = makeControlledStorage({
      initialRecord: makeRecord(snapshot, undefined),
    });
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });

    // when
    store.init();

    // then: 복원된 최초 Idle snapshot이 저장 요청된다
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "복원된 최초 Idle의 자동 저장 요청",
    );
    expect(
      controlled.saveCalls[0].record.snapshot.events.map((event) => event.id),
    ).toEqual(snapshot.events.map((event) => event.id));
  });
});

describe("사용할 수 없는 snapshot에서 recover한 최초 Idle이 기존 record를 대체한다", () => {
  test("invalid record에서 recover한 뒤 첫 save가 완료되면 다음 실행의 load()는 invalid record가 아니라 recovered fresh Idle record를 반환한다", async () => {
    // given: invalid record와 recover 정책, 완료 record를 교체하는 storage
    const invalidRecord = makeRecord(invalidSchemaSnapshot(), undefined);
    const controlled = makeControlledStorage({
      initialRecord: invalidRecord,
    });
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          onLoadError: () => ({ policy: "recover" }),
        }),
      ],
    });

    // when: fresh create 후 첫 save를 완료한다
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "recover된 fresh Idle의 자동 저장 요청",
    );
    controlled.saveCalls[0].resolve();
    expect(controlled.completedRecord).not.toBe(invalidRecord);

    // then: 다음 실행기는 recovered fresh record를 복원한다
    const observer = makeObserverPlugin();
    const nextStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({ storage: controlled.storage }),
        observer.plugin,
      ],
    });
    nextStore.init();

    expect(observer.initCalls[0].kind).toBe("load");
    expect(nextStore.actions.getStack().activities.map((a) => a.id)).toEqual([
      "fresh-home-1",
    ]);
  });
});

describe("종류와 무관하게 완료된 탐색 변경은 Idle 도달 시 자동 보존된다", () => {
  const navigationCases: Array<{
    label: string;
    seed: () => ReturnType<typeof freshEvents>;
    act: (actions: StackflowActions) => void;
  }> = [
    {
      label: "push",
      seed: freshEvents,
      act: (actions) =>
        actions.push({
          activityId: "nav-article-1",
          activityName: ARTICLE_ACTIVITY,
          activityParams: { articleId: "nav-a-1" },
        }),
    },
    {
      label: "replace",
      seed: freshEvents,
      act: (actions) =>
        actions.replace({
          activityId: "nav-article-2",
          activityName: ARTICLE_ACTIVITY,
          activityParams: { articleId: "nav-a-2" },
        }),
    },
    {
      label: "pop",
      seed: twoActivityEvents,
      act: (actions) => actions.pop(),
    },
    {
      label: "stepPush",
      seed: freshEvents,
      act: (actions) =>
        actions.stepPush({
          stepId: "nav-step-2",
          stepParams: { page: "2" },
        }),
    },
    {
      label: "stepReplace",
      seed: withStepEvents,
      act: (actions) =>
        actions.stepReplace({
          stepId: "nav-step-2r",
          stepParams: { page: "2-r" },
        }),
    },
    {
      label: "stepPop",
      seed: withStepEvents,
      act: (actions) => actions.stepPop(),
    },
  ];

  for (const { label, seed, act } of navigationCases) {
    test(`${label}가 Idle에 도달하면 완료된 해당 탐색 맥락의 snapshot 저장 요청이 한 번 추가된다`, async () => {
      // given: 기준점 저장까지 끝낸 fresh store
      const controlled = makeControlledStorage();
      const store = makeCoreStore({
        initialEvents: seed(),
        plugins: [stackPersistencePlugin({ storage: controlled.storage })],
      });
      store.init();
      await waitForCondition(
        () => controlled.saveCalls.length >= 1,
        "기준점 자동 저장 요청",
      );

      // when: public action을 수행하고 Idle 조건까지 전진한다
      act(store.actions);
      await advanceUntilIdle(store.actions.getStack);
      await waitForCondition(
        () => controlled.saveCalls.length >= 2,
        `${label} 완료 후 자동 저장 요청`,
      );

      // then: 정확히 한 번 추가되고, 그 내용은 완료된 탐색 맥락의 snapshot이다
      expect(controlled.saveCalls).toHaveLength(2);
      expect(controlled.saveCalls[1].record.snapshot).toEqual(
        store.actions.captureSnapshot(),
      );
    });
  }
});

describe("전환 중에는 저장하지 않는다", () => {
  test("navigation 직후 transition 진행 중에는 새 save가 없고, 같은 변경이 Idle에 도달한 뒤에만 새 save가 생긴다", async () => {
    // given: 기준점 저장이 끝난 store
    const controlled = makeControlledStorage();
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "기준점 자동 저장 요청",
    );

    // when: transition이 진행되는 동안 시간을 멈춰 관찰한다
    store.actions.push({
      activityId: "nav-article-1",
      activityName: ARTICLE_ACTIVITY,
      activityParams: {},
    });
    expect(store.actions.getStack().globalTransitionState).toBe("loading");

    for (let i = 0; i < 5; i += 1) {
      await vi.advanceTimersByTimeAsync(17);
    }
    expect(store.actions.getStack().globalTransitionState).toBe("loading");

    // then: transition 중 새 save 없음
    expect(controlled.saveCalls).toHaveLength(1);

    // then: 같은 변경이 Idle에 도달한 뒤에만 새 save
    await advanceUntilIdle(store.actions.getStack);
    await waitForCondition(
      () => controlled.saveCalls.length >= 2,
      "Idle 도달 후 자동 저장 요청",
    );
    expect(controlled.saveCalls).toHaveLength(2);
  });
});

describe("일시정지 상태는 저장하지 않되 load 입력으로는 허용한다", () => {
  test("paused snapshot은 그대로 복원되고, paused 동안 save가 없으며, resume 후 unpaused Idle snapshot만 저장된다", async () => {
    // given: pausedSnapshot을 load한 store — paused라는 이유로 load가 거부되지 않는다
    const controlled = makeControlledStorage({
      initialRecord: makeRecord(pausedSnapshot(), undefined),
    });
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });

    // then: paused 상태 그대로 복원됐다 — Paused 뒤에 기록된 탐색은 큐에
    // 남아 아직 적용되지 않았다
    expect(store.actions.getStack().globalTransitionState).toBe("paused");
    expect(navigationOrderIds(store.actions.getStack())).toEqual([
      "paused-home-1",
    ]);

    // when: paused 동안 시간이 지나도 저장이 없다
    store.init();
    await settleMicrotasks();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(controlled.saveCalls).toHaveLength(0);

    // when: resume하여 큐된 탐색이 적용되고 Idle까지 진행한다
    store.actions.resume();
    await advanceUntilIdle(store.actions.getStack);
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "resume 후 unpaused Idle의 자동 저장 요청",
    );

    // then: unpaused Idle snapshot만 저장됐다 — resume이 실제로 상태를
    // 진행시켰다(큐에 있던 진입이 적용됨)
    expect(store.actions.getStack().globalTransitionState).toBe("idle");
    expect(navigationOrderIds(store.actions.getStack())).toEqual([
      "paused-home-1",
      "paused-article-1",
    ]);
    expect(controlled.saveCalls).toHaveLength(1);
    const savedEvents = controlled.saveCalls[0].record.snapshot.events;
    expect(savedEvents[savedEvents.length - 1]?.name).toBe("Resumed");
    expect(controlled.saveCalls[0].record.snapshot).toEqual(
      store.actions.captureSnapshot(),
    );
  });
});

describe("Idle 도달 전에 실행기가 끝나면 진행 중이던 변경은 복원 대상이 아니다", () => {
  test("기준점 record 저장 완료 후 transition 중에 시작한 새 실행기는 마지막 완료 Idle record를 복원한다", async () => {
    // given: 기준점 record 저장이 완료된 store
    const controlled = makeControlledStorage();
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "기준점 자동 저장 요청",
    );
    controlled.saveCalls[0].resolve();
    const baselineView = logicalStackView(store.actions.getStack());

    // when: 새 transition을 시작하되 Idle로 전진시키지 않고 새 실행기를 시작한다
    store.actions.push({
      activityId: "nav-article-1",
      activityName: ARTICLE_ACTIVITY,
      activityParams: {},
    });
    expect(store.actions.getStack().globalTransitionState).toBe("loading");

    const nextStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });

    // then: 진행 중이던 변경이 아니라 마지막 완료 Idle record가 복원된다
    const nextView = logicalStackView(nextStore.actions.getStack());
    expect(nextView).toEqual(baselineView);
    expect(nextView.activities.map((a) => a.id)).toEqual(["fresh-home-1"]);
  });
});

describe("pending save는 탐색과 후속 capture를 막지 않는다", () => {
  test("첫 save Promise가 pending이어도 다음 navigation은 즉시 진행되고 후속 save 호출도 발생한다", async () => {
    // given: 첫 save를 pending으로 유지하는 storage
    const controlled = makeControlledStorage();
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "기준점 자동 저장 요청",
    );
    expect(controlled.saveCalls[0].state).toBe("pending");

    // when: 사용자가 다음 navigation을 수행해 다시 Idle에 도달한다
    store.actions.push({
      activityId: "nav-article-1",
      activityName: ARTICLE_ACTIVITY,
      activityParams: {},
    });

    // then: navigation 상태는 즉시 진행된다 — Promise 완료를 기다리지 않는다
    expect(
      store.actions.getStack().activities.map((activity) => activity.id),
    ).toContain("nav-article-1");

    await advanceUntilIdle(store.actions.getStack);
    await waitForCondition(
      () => controlled.saveCalls.length >= 2,
      "pending save 중의 후속 자동 저장 요청",
    );

    // then: 첫 save가 여전히 pending인 채 후속 save가 호출됐다
    expect(controlled.saveCalls[0].state).toBe("pending");
    expect(controlled.saveCalls).toHaveLength(2);
  });
});

describe("복원 보장선은 storage가 완료한 마지막 Idle record다", () => {
  test("호출됐지만 pending인 record는 복원되지 않고, 완료된 뒤에야 복원된다", async () => {
    // given: record A는 완료, B는 호출됐지만 pending인 storage
    const controlled = makeControlledStorage();
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "record A 자동 저장 요청",
    );
    controlled.saveCalls[0].resolve();

    store.actions.push({
      activityId: "nav-article-1",
      activityName: ARTICLE_ACTIVITY,
      activityParams: {},
    });
    await advanceUntilIdle(store.actions.getStack);
    await waitForCondition(
      () => controlled.saveCalls.length >= 2,
      "record B 자동 저장 요청",
    );
    expect(controlled.saveCalls[1].state).toBe("pending");

    // when/then: B 완료 전의 새 실행기는 A를 복원한다
    const beforeStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });
    expect(beforeStore.actions.getStack().activities.map((a) => a.id)).toEqual([
      "fresh-home-1",
    ]);

    // when/then: B 완료 후의 새 실행기는 B를 복원한다
    controlled.saveCalls[1].resolve();
    const afterStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });
    expect(navigationOrderIds(afterStore.actions.getStack())).toEqual([
      "fresh-home-1",
      "nav-article-1",
    ]);
  });
});
