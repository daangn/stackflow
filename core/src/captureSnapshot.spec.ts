import { makeEvent } from "./event-utils";
import type { StackflowPlugin } from "./interfaces";
import { makeCoreStore } from "./makeCoreStore";
import type { StackSnapshot } from "./StackSnapshot";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;

/** A settled-in-the-past timestamp with a strictly increasing tail. */
const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

const provideSnapshot =
  (snapshot: StackSnapshot | null): StackflowPlugin =>
  () => ({
    key: "provider",
    provideSnapshot: () => snapshot,
  });

test('captureSnapshot - 반환 스냅샷의 $schema가 "stackflow.snapshot.v1"입니다', () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [],
  });

  const snapshot = actions.captureSnapshot();

  expect(snapshot.$schema).toEqual("stackflow.snapshot.v1");
});

test("captureSnapshot - 스냅샷 events에서 Initialized·ActivityRegistered를 제외합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [],
  });

  const snapshot = actions.captureSnapshot();

  expect(snapshot.events.map((e) => e.name)).toEqual(["Pushed"]);
  expect(
    snapshot.events.some(
      (e) => e.name === "Pushed" && e.activityId === "a1",
    ),
  ).toBe(true);
});

test("captureSnapshot - 스냅샷 events에서 Paused·Resumed를 제외합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [],
  });

  actions.pause();
  actions.push({ activityId: "a2", activityName: "hello", activityParams: {} });
  actions.resume();

  const snapshot = actions.captureSnapshot();

  const names = snapshot.events.map((e) => e.name);
  expect(names).not.toContain("Paused");
  expect(names).not.toContain("Resumed");
});

test("captureSnapshot - 6종 탐색 이벤트를 모두 보존합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      // transitionDuration 0 so each dispatched event commits (settles)
      // instantly — the capture predicate keeps only committed navigation.
      makeEvent("Initialized", {
        transitionDuration: 0,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [],
  });

  // Produce each of the six navigation events at least once.
  actions.push({ activityId: "a2", activityName: "hello", activityParams: {} });
  actions.stepPush({ stepId: "s1", stepParams: {} });
  actions.stepReplace({ stepId: "s1b", stepParams: {} });
  actions.stepPop();
  actions.replace({
    activityId: "a3",
    activityName: "hello",
    activityParams: {},
  });
  actions.pop();

  const snapshot = actions.captureSnapshot();
  const names = new Set(snapshot.events.map((e) => e.name));

  expect(names).toContain("Pushed");
  expect(names).toContain("Replaced");
  expect(names).toContain("Popped");
  expect(names).toContain("StepPushed");
  expect(names).toContain("StepReplaced");
  expect(names).toContain("StepPopped");
});

test("captureSnapshot - events를 eventDate 오름차순으로 정렬해 반환합니다", () => {
  const initDate = enoughPastTime();
  const regDate = enoughPastTime();
  const earlier = enoughPastTime();
  const later = enoughPastTime();

  const { actions } = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: initDate,
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: regDate,
      }),
      // Log order is (later, earlier) — the reverse of eventDate order.
      makeEvent("Pushed", {
        activityId: "a-later",
        activityName: "hello",
        activityParams: {},
        eventDate: later,
      }),
      makeEvent("Pushed", {
        activityId: "a-earlier",
        activityName: "hello",
        activityParams: {},
        eventDate: earlier,
      }),
    ],
    plugins: [],
  });

  const snapshot = actions.captureSnapshot();

  expect(snapshot.events.map((e) => e.eventDate)).toEqual([earlier, later]);
  expect(
    snapshot.events.map((e) => (e.name === "Pushed" ? e.activityId : e.name)),
  ).toEqual(["a-earlier", "a-later"]);
});

test("captureSnapshot - 동일 id 이벤트를 중복 제거합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        id: "duplicated-id",
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        id: "duplicated-id",
        activityId: "a2",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [],
  });

  const snapshot = actions.captureSnapshot();

  expect(snapshot.events.filter((e) => e.id === "duplicated-id")).toHaveLength(
    1,
  );
});

test("captureSnapshot - 생성 이후 커밋된 탐색 이벤트를 포함합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      // transitionDuration 0 so the post-create push commits instantly and is
      // captured — capture keeps committed navigation, not mid-transition.
      makeEvent("Initialized", {
        transitionDuration: 0,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [],
  });

  actions.push({ activityId: "a2", activityName: "hello", activityParams: {} });

  const snapshot = actions.captureSnapshot();
  const pushedIds = snapshot.events
    .filter((e) => e.name === "Pushed")
    .map((e) => (e.name === "Pushed" ? e.activityId : undefined));

  expect(pushedIds).toContain("a1");
  expect(pushedIds).toContain("a2");
});

test("captureSnapshot - pause 중 큐잉되어 resume되지 않은 탐색 이벤트는 제외합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [],
  });

  actions.pause();
  actions.push({ activityId: "a2", activityName: "hello", activityParams: {} });

  // Queued behind the pause, a2 never became a visible activity — the live
  // session never committed it, so the snapshot must not resurrect it.
  expect(
    actions.getStack().activities.some((a) => a.id === "a2"),
  ).toBe(false);

  try {
    const snapshot = actions.captureSnapshot();
    const names = snapshot.events.map((e) => e.name);

    expect(
      snapshot.events.some(
        (e) => e.name === "Pushed" && e.activityId === "a2",
      ),
    ).toBe(false);
    // a1, committed before the pause, is still captured.
    expect(
      snapshot.events.some(
        (e) => e.name === "Pushed" && e.activityId === "a1",
      ),
    ).toBe(true);
    expect(names).not.toContain("Paused");
  } finally {
    // Resume so the paused store settles and its polling interval clears,
    // even when the capture above throws.
    actions.resume();
  }
});

test("captureSnapshot - 전환이 진행 중인(미정착) 탐색 이벤트는 제외되어, load 시 직전 커밋 상태로 복원됩니다", () => {
  const source = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [],
  });

  // Push at the current time so the new activity is mid-transition.
  source.actions.push({
    activityId: "a2",
    activityName: "hello",
    activityParams: {},
  });
  expect(source.actions.getStack().globalTransitionState).toEqual("loading");

  const snapshot = source.actions.captureSnapshot();

  // The mid-transition push is uncommitted, so it is not captured...
  expect(
    snapshot.events.some((e) => e.name === "Pushed" && e.activityId === "a2"),
  ).toBe(false);
  expect(
    snapshot.events.some((e) => e.name === "Pushed" && e.activityId === "a1"),
  ).toBe(true);

  const restored = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [provideSnapshot(snapshot)],
  });

  const restoredStack = restored.actions.getStack();

  // ...so the restore reflects the last committed state: a1 alone, settled.
  expect(restoredStack.activities.map((a) => a.id)).toEqual(["a1"]);
  expect(restoredStack.activities.find((a) => a.isTop)?.transitionState).toEqual(
    "enter-done",
  );
  expect(restoredStack.globalTransitionState).toEqual("idle");
});

test("captureSnapshot - 같은 액티비티의 정착 Pushed는 남기고 미정착 Popped만 제외합니다", () => {
  // A and B restored settled (load rebases them into the past); a pop at the
  // current time is mid-transition. The pop targets B, whose Pushed already
  // committed — so capture keeps both Pushes and drops only the unsettled
  // Popped. Per-event, not per-activity: a "B is exiting" rule would wrongly
  // drop B entirely.
  const store = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "A",
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "B",
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      provideSnapshot({
        $schema: "stackflow.snapshot.v1",
        events: [
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
          makeEvent("Pushed", {
            activityId: "b1",
            activityName: "B",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ],
      }),
    ],
  });

  // Both restored settled; pop B so its exit is mid-transition.
  store.actions.pop();
  expect(
    store.actions.getStack().activities.find((a) => a.id === "b1")
      ?.transitionState,
  ).toEqual("exit-active");

  const snapshot = store.actions.captureSnapshot();

  // The unsettled Popped is dropped; both settled Pushes remain.
  expect(snapshot.events.map((e) => e.name)).toEqual(["Pushed", "Pushed"]);

  // Reloading restores A and B both settled — the uncommitted pop is undone.
  const restored = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "A",
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "B",
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [provideSnapshot(snapshot)],
  });
  const restoredStack = restored.actions.getStack();

  expect(restoredStack.activities.map((a) => a.id)).toEqual(["a1", "b1"]);
  expect(
    restoredStack.activities.find((a) => a.id === "a1")?.transitionState,
  ).toEqual("enter-done");
  expect(
    restoredStack.activities.find((a) => a.id === "b1")?.transitionState,
  ).toEqual("enter-done");
  expect(restoredStack.activities.find((a) => a.isTop)?.id).toEqual("b1");
});
