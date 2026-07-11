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

test("captureSnapshot - Paused·Resumed도 기록된 그대로 스냅샷 events에 포함합니다", () => {
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

  // The pause markers are runtime history like any other event — replaying
  // them reproduces the same pause/resume sequence, so they are carried as-is.
  const names = snapshot.events.map((e) => e.name);
  expect(names).toEqual(["Pushed", "Paused", "Pushed", "Resumed"]);
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

test("captureSnapshot - events를 정렬 없이 기록된 순서 그대로 반환합니다", () => {
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

  // Capture does not sort — load's `aggregate` does. The recorded (later,
  // earlier) order is preserved verbatim.
  expect(snapshot.events.map((e) => e.eventDate)).toEqual([later, earlier]);
  expect(
    snapshot.events.map((e) => (e.name === "Pushed" ? e.activityId : e.name)),
  ).toEqual(["a-later", "a-earlier"]);
});

test("captureSnapshot - 동일 id 이벤트를 그대로 두고 중복 제거는 load에 맡깁니다", () => {
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

  // Capture is a faithful projection of the recorded log; it does not dedupe.
  // A pathological duplicate id survives capture and is collapsed at load
  // time by `aggregate`'s dedupe-by-id.
  expect(snapshot.events.filter((e) => e.id === "duplicated-id")).toHaveLength(
    2,
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

test("captureSnapshot - pause 중 캡처하면 Paused 마커와 큐잉된 탐색 이벤트가 그대로 담깁니다", () => {
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

  // Queued behind the pause, a2 is not applied to the live stack — and the
  // snapshot records exactly that: the queued push together with the Paused
  // marker that quarantines it, so a reload reproduces the same paused stack.
  expect(actions.getStack().activities.some((a) => a.id === "a2")).toBe(false);

  try {
    const snapshot = actions.captureSnapshot();
    const names = snapshot.events.map((e) => e.name);

    expect(names).toEqual(["Pushed", "Paused", "Pushed"]);
    expect(
      snapshot.events.some(
        (e) => e.name === "Pushed" && e.activityId === "a2",
      ),
    ).toBe(true);
  } finally {
    // Resume so the paused store settles and its polling interval clears,
    // even when the capture above throws.
    actions.resume();
  }
});

test("captureSnapshot - 전환이 진행 중인 탐색 이벤트도 포함되어 load 시 그대로 재생됩니다", () => {
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

  // A transition is only visual — a2 is recorded in the stack, so it is
  // captured despite being mid-transition.
  expect(
    snapshot.events.some((e) => e.name === "Pushed" && e.activityId === "a2"),
  ).toBe(true);
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

  // Both restore, replayed at their recorded dates — the push captured
  // mid-transition is still mid-transition on load, exactly as captured.
  expect(restoredStack.activities.map((a) => a.id)).toEqual(["a1", "a2"]);
  expect(restoredStack.activities.find((a) => a.isTop)?.id).toEqual("a2");
  expect(restoredStack.activities.find((a) => a.isTop)?.transitionState).toEqual(
    "enter-active",
  );
  expect(restoredStack.globalTransitionState).toEqual("loading");
});

test("captureSnapshot - 전환 중 pop한 이벤트도 Pushed·Popped가 모두 담겨 load 시 pop이 반영됩니다", () => {
  // a1 restored settled; push b1, then pop it while both transitions are in
  // flight. The push and the pop are both recorded, so both are captured, and
  // the reload replays them — the pop takes effect (b1 exits, a1 active again).
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
        ],
      }),
    ],
  });

  store.actions.push({ activityId: "b1", activityName: "B", activityParams: {} });
  store.actions.pop();
  expect(
    store.actions.getStack().activities.find((a) => a.id === "b1")
      ?.transitionState,
  ).toEqual("exit-active");

  const snapshot = store.actions.captureSnapshot();

  // Both the mid-transition push and the mid-transition pop are captured.
  expect(
    snapshot.events.some((e) => e.name === "Pushed" && e.activityId === "b1"),
  ).toBe(true);
  expect(snapshot.events.some((e) => e.name === "Popped")).toBe(true);

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

  // The pop is reflected mid-flight, as captured: b1 is exiting, and a1 is
  // the active activity again.
  expect(restoredStack.activities.find((a) => a.isActive)?.id).toEqual("a1");
  expect(
    restoredStack.activities.find((a) => a.id === "b1")?.transitionState,
  ).toEqual("exit-active");
  expect(restoredStack.globalTransitionState).toEqual("loading");
});
