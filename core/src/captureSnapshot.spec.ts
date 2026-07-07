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

test("captureSnapshot - 생성 이후 디스패치된 탐색 이벤트를 포함합니다", () => {
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

  actions.push({ activityId: "a2", activityName: "hello", activityParams: {} });

  const snapshot = actions.captureSnapshot();
  const pushedIds = snapshot.events
    .filter((e) => e.name === "Pushed")
    .map((e) => (e.name === "Pushed" ? e.activityId : undefined));

  expect(pushedIds).toContain("a1");
  expect(pushedIds).toContain("a2");
});

test("captureSnapshot - pause 중 디스패치된 탐색 이벤트를 포함하되 Paused는 제외합니다", () => {
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

  // While paused, the pushed event is queued, so it is not yet a visible
  // activity — capturing from aggregated state would silently miss it.
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
    ).toBe(true);
    expect(names).not.toContain("Paused");
  } finally {
    // Resume so the paused store settles and its polling interval clears,
    // even when the capture above throws.
    actions.resume();
  }
});

test("captureSnapshot - 전환 진행 중 캡처한 스냅샷을 load하면 정착 상태로 복원됩니다", () => {
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
  const topActivity = restoredStack.activities.find((a) => a.isTop);

  expect(topActivity?.transitionState).toEqual("enter-done");
  expect(restoredStack.globalTransitionState).toEqual("idle");
});
