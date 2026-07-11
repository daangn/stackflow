import type { DomainEvent } from "./event-types";
import { makeEvent } from "./event-utils";
import type { StackflowPlugin } from "./interfaces";
import { makeCoreStore } from "./makeCoreStore";
import type { SnapshotEvent, StackSnapshot } from "./StackSnapshot";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;

const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

/** A future timestamp — models a capture session whose clock ran ahead. */
const futureTime = () => {
  dt += 1;
  return new Date(Date.now() + MINUTE).getTime() + dt;
};

const config = (
  activityNames: string[],
  transitionDuration = 350,
): DomainEvent[] => [
  makeEvent("Initialized", {
    transitionDuration,
    eventDate: enoughPastTime(),
  }),
  ...activityNames.map((activityName) =>
    makeEvent("ActivityRegistered", {
      activityName,
      eventDate: enoughPastTime(),
    }),
  ),
];

const provideSnapshotPlugin =
  (events: SnapshotEvent[]): StackflowPlugin =>
  () => ({
    key: "provider",
    provideSnapshot: (): StackSnapshot => ({
      $schema: "stackflow.snapshot.v1",
      events,
    }),
  });

test("load - 스냅샷 이벤트의 eventDate를 재기저 없이 그대로 보존해 재생합니다", () => {
  const originalPushDate = enoughPastTime();
  const originalStepDate = enoughPastTime();

  const { actions } = makeCoreStore({
    initialEvents: config(["A"]),
    plugins: [
      provideSnapshotPlugin([
        makeEvent("Pushed", {
          id: "e1",
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: originalPushDate,
        }),
        makeEvent("StepPushed", {
          id: "e2",
          targetActivityId: "a1",
          stepId: "s2",
          stepParams: {},
          eventDate: originalStepDate,
        }),
      ]),
    ],
  });

  const a = actions.getStack().activities.find((x) => x.id === "a1");

  // The snapshot events are preserved byte-for-byte — eventDate included.
  expect(a?.id).toEqual("a1");
  expect(a?.enteredBy.id).toEqual("e1");
  expect(a?.enteredBy.eventDate).toEqual(originalPushDate);
  expect(a?.steps[1].id).toEqual("s2");
  expect(a?.steps[1].enteredBy.id).toEqual("e2");
  expect(a?.steps[1].enteredBy.eventDate).toEqual(originalStepDate);
});

test("load - 재생 순서는 기록된 eventDate 순서입니다(배열 순서 아님)", () => {
  // Core capture preserves recorded array order (it no longer sorts), so a
  // snapshot's array order can disagree with its date order; either way the
  // dates are the replay truth (aggregate sorts by eventDate).
  const earlierDate = enoughPastTime();
  const laterDate = enoughPastTime();

  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [
      provideSnapshotPlugin([
        // Array order [A, B] disagrees with date order (A is dated later).
        makeEvent("Pushed", {
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: laterDate,
        }),
        makeEvent("Pushed", {
          activityId: "b1",
          activityName: "B",
          activityParams: {},
          eventDate: earlierDate,
        }),
      ]),
    ],
  });

  const a = actions.getStack().activities.find((x) => x.id === "a1");
  const b = actions.getStack().activities.find((x) => x.id === "b1");

  // Date order wins: B (earlier) below, A (later) on top.
  expect((b?.zIndex ?? -1) < (a?.zIndex ?? -1)).toBe(true);
  expect(a?.isTop).toBe(true);
});

test("load - 과거에 기록된 스냅샷은 정착 상태(enter-done·idle)로 복원됩니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"], 350),
    plugins: [
      provideSnapshotPlugin([
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
      ]),
    ],
  });

  // The recorded dates predate now − transitionDuration, so the as-is replay
  // itself folds to a settled stack — no re-dating involved.
  const stack = actions.getStack();
  expect(stack.activities.find((x) => x.id === "a1")?.transitionState).toEqual(
    "enter-done",
  );
  expect(stack.activities.find((x) => x.id === "b1")?.transitionState).toEqual(
    "enter-done",
  );
  expect(stack.globalTransitionState).toEqual("idle");
});

test("load - 미래 date 스냅샷(캡처 세션 시계 선행)도 그대로 재생되며 core는 정규화하지 않습니다", () => {
  // As-is replay accepts the recorded dates as truth even when the capture
  // session's clock ran ahead — the restored activities stay unsettled until
  // the local clock catches up. A supplier or plugin that wants to rule this
  // out normalizes the dates in overrideInitialEvents.
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"], 350),
    plugins: [
      provideSnapshotPlugin([
        makeEvent("Pushed", {
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: futureTime(),
        }),
        makeEvent("Pushed", {
          activityId: "b1",
          activityName: "B",
          activityParams: {},
          eventDate: futureTime(),
        }),
      ]),
    ],
  });

  const stack = actions.getStack();
  expect(stack.activities.find((x) => x.id === "a1")?.transitionState).toEqual(
    "enter-active",
  );
  expect(stack.activities.find((x) => x.id === "b1")?.transitionState).toEqual(
    "enter-active",
  );
  expect(stack.globalTransitionState).toEqual("loading");
});

test("load - 플러그인이 overrideInitialEvents에서 재기저하면 정착 복원을 스스로 보장할 수 있습니다", () => {
  // The escape hatch for the test above: a plugin re-dates the replay
  // sequence into the settled past, restoring a fully-settled stack from the
  // same future-dated snapshot.
  const settlePlugin: StackflowPlugin = () => ({
    key: "settler",
    overrideInitialEvents: ({ initialEvents, initInfo }) =>
      initInfo.kind === "load"
        ? initialEvents.map((event, index) => ({
            ...event,
            eventDate: Date.now() - MINUTE + index,
          }))
        : initialEvents,
  });

  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"], 350),
    plugins: [
      provideSnapshotPlugin([
        makeEvent("Pushed", {
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: futureTime(),
        }),
        makeEvent("Pushed", {
          activityId: "b1",
          activityName: "B",
          activityParams: {},
          eventDate: futureTime(),
        }),
      ]),
      settlePlugin,
    ],
  });

  const stack = actions.getStack();
  expect(
    stack.activities.every((x) => x.transitionState === "enter-done"),
  ).toBe(true);
  expect(stack.activities.find((x) => x.isTop)?.id).toEqual("b1");
  expect(stack.globalTransitionState).toEqual("idle");
});

test("load - 이벤트 수와 무관하게 정적 이벤트가 모든 스냅샷 이벤트보다 앞 시점으로 재기저됩니다", () => {
  // Only the statics are re-dated: pinned just before the earliest snapshot
  // event so registration and transitionDuration apply before any replayed
  // event, for any history length.
  const transitionDuration = 350;
  const staticEvents: DomainEvent[] = [
    makeEvent("Initialized", {
      transitionDuration,
      eventDate: enoughPastTime(),
    }),
    makeEvent("ActivityRegistered", {
      activityName: "A",
      eventDate: enoughPastTime(),
    }),
  ];
  const snapshotEvents = Array.from({ length: 400 }, (_, index) =>
    makeEvent("Pushed", {
      activityId: `a${index}`,
      activityName: "A",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
  );
  const originalDates = snapshotEvents.map((e) => e.eventDate);

  const store = makeCoreStore({
    initialEvents: staticEvents,
    plugins: [provideSnapshotPlugin(snapshotEvents)],
  });

  const log = store.pullEvents();
  const staticDates = log
    .filter((e) => e.name === "Initialized" || e.name === "ActivityRegistered")
    .map((e) => e.eventDate);
  const replayedDates = log
    .filter((e) => e.name === "Pushed")
    .map((e) => e.eventDate);

  // Statics sort strictly before every snapshot event; the snapshot events
  // themselves keep their recorded dates untouched.
  expect(Math.max(...staticDates)).toBeLessThan(Math.min(...replayedDates));
  expect(replayedDates).toEqual(originalDates);

  const stack = store.actions.getStack();
  expect(stack.globalTransitionState).toEqual("idle");
  expect(stack.activities.find((x) => x.isTop)?.id).toEqual("a399");
});

test("load - transitionDuration이 0이어도 정적 이벤트가 스냅샷 이벤트보다 앞에 정렬됩니다", () => {
  // Static backdating is pinned to the earliest snapshot event, not to the
  // clock or the transition duration, so td=0 (where fresh static dates and
  // fresh navigation dates would collide) plays no role in the ordering.
  const staticEvents: DomainEvent[] = [
    makeEvent("Initialized", {
      transitionDuration: 0,
      eventDate: Date.now(),
    }),
    makeEvent("ActivityRegistered", {
      activityName: "A",
      eventDate: Date.now(),
    }),
  ];
  const snapshotEvents = [
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "A",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "A",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
  ];

  const store = makeCoreStore({
    initialEvents: staticEvents,
    plugins: [provideSnapshotPlugin(snapshotEvents)],
  });

  const log = store.pullEvents();
  const staticDates = log
    .filter((e) => e.name === "Initialized" || e.name === "ActivityRegistered")
    .map((e) => e.eventDate);
  const replayedDates = log
    .filter((e) => e.name === "Pushed")
    .map((e) => e.eventDate);

  expect(Math.max(...staticDates)).toBeLessThan(Math.min(...replayedDates));

  const stack = store.actions.getStack();
  expect(stack.globalTransitionState).toEqual("idle");
  expect(
    stack.activities.every((x) => x.transitionState === "enter-done"),
  ).toBe(true);
  expect(stack.activities.find((x) => x.isTop)?.id).toEqual("a2");
});

test("load - 스냅샷 꼬리가 unresumed Paused여도 정적 이벤트는 그보다 앞에 적용되어 격리되지 않습니다", () => {
  // Statics sorted after an unresumed Paused would be quarantined with the
  // queued events — leaving the restored stack with transitionDuration 0 and
  // no registered activities. Backdating statics ahead of the whole replay
  // sequence rules that out structurally.
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"], 350),
    plugins: [
      provideSnapshotPlugin([
        makeEvent("Pushed", {
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: enoughPastTime(),
        }),
        makeEvent("Paused", {
          eventDate: enoughPastTime(),
        }),
        makeEvent("Pushed", {
          activityId: "b1",
          activityName: "B",
          activityParams: {},
          eventDate: enoughPastTime(),
        }),
      ]),
    ],
  });

  const stack = actions.getStack();
  // The statics applied before the pause: config-derived state is intact.
  expect(stack.transitionDuration).toEqual(350);
  expect(stack.registeredActivities.map((x) => x.name)).toEqual(["A", "B"]);
  // The pause itself round-tripped: b1 stays quarantined behind it.
  expect(stack.globalTransitionState).toEqual("paused");
  expect(stack.activities.map((x) => x.id)).toEqual(["a1"]);
});

test("load - load 후 pop이 복원 최상단을 exit 전환시키고 아래 복원 activity를 재노출합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"], 350),
    plugins: [
      provideSnapshotPlugin([
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
      ]),
    ],
  });

  actions.pop();

  const stack = actions.getStack();
  const a = stack.activities.find((x) => x.id === "a1");
  const b = stack.activities.find((x) => x.id === "b1");

  // Pop targeted the restored top: it began its exit transition (the Popped
  // event, dispatched at the current time, sorts after the past-dated
  // restored events)...
  expect(b?.transitionState).toEqual("exit-active");
  expect(b?.exitedBy?.name).toEqual("Popped");
  // ...and the restored activity below is re-exposed as the active one.
  expect(a?.transitionState).toEqual("enter-done");
  expect(a?.isActive).toBe(true);
});

test("load - load 후 stepPush가 최신 활성 activity(복원 최상단)를 타깃합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"], 350),
    plugins: [
      provideSnapshotPlugin([
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
      ]),
    ],
  });

  actions.stepPush({ stepId: "s1", stepParams: { step: "1" } });

  const stack = actions.getStack();
  const a = stack.activities.find((x) => x.id === "a1");
  const b = stack.activities.find((x) => x.id === "b1");

  // StepPushed resolves its target by eventDate (latest active activity) —
  // it lands on the restored top because the preserved past dates keep the
  // restored order below the new event.
  expect(b?.steps.map((s) => s.id)).toEqual(["b1", "s1"]);
  expect(b?.params.step).toEqual("1");
  expect(a?.steps.map((s) => s.id)).toEqual(["a1"]);
});
