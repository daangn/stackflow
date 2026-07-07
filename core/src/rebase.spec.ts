import type { DomainEvent } from "./event-types";
import { makeEvent } from "./event-utils";
import type { StackflowPlugin } from "./interfaces";
import { makeCoreStore } from "./makeCoreStore";
import type { NavigationEvent, StackSnapshot } from "./StackSnapshot";

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
  (events: NavigationEvent[]): StackflowPlugin =>
  () => ({
    key: "provider",
    provideSnapshot: (): StackSnapshot => ({
      $schema: "stackflow.snapshot.v1",
      events,
    }),
  });

test("load - 스냅샷 events의 배열 순서대로 z-order를 재구성합니다(원본 eventDate 순서가 아님)", () => {
  const laterDate = enoughPastTime();
  const earlierDate = enoughPastTime();
  // laterDate < earlierDate is false; make A's original date the *later* one so
  // array order [A, B] disagrees with original-date order.
  const aDate = Math.max(laterDate, earlierDate);
  const bDate = Math.min(laterDate, earlierDate);

  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [
      provideSnapshotPlugin([
        makeEvent("Pushed", {
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: aDate,
        }),
        makeEvent("Pushed", {
          activityId: "b1",
          activityName: "B",
          activityParams: {},
          eventDate: bDate,
        }),
      ]),
    ],
  });

  const a = actions.getStack().activities.find((x) => x.id === "a1");
  const b = actions.getStack().activities.find((x) => x.id === "b1");

  // Array order wins: A below, B on top — not the original-date order.
  expect((a?.zIndex ?? -1) < (b?.zIndex ?? -1)).toBe(true);
  expect(b?.isTop).toBe(true);
});

test("load - transitionDuration이 커도 모든 복원 activity를 enter-done으로, globalTransitionState를 idle로 정착시킵니다", () => {
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

  const stack = actions.getStack();
  expect(stack.activities.find((x) => x.id === "a1")?.transitionState).toEqual(
    "enter-done",
  );
  expect(stack.activities.find((x) => x.id === "b1")?.transitionState).toEqual(
    "enter-done",
  );
  expect(stack.globalTransitionState).toEqual("idle");
});

test("load - 캡처 세션 시계가 앞서 있어도 load 후 새 push가 복원 activity들 뒤로 정렬됩니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B", "C"], 350),
    plugins: [
      provideSnapshotPlugin([
        // Original dates are in the future (capture clock ran ahead).
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

  actions.push({ activityId: "c1", activityName: "C", activityParams: {} });

  const stack = actions.getStack();
  const a = stack.activities.find((x) => x.id === "a1");
  const b = stack.activities.find((x) => x.id === "b1");
  const c = stack.activities.find((x) => x.id === "c1");

  // A new push lands on top of the restored activities; no order collapse.
  expect((a?.zIndex ?? -1) < (b?.zIndex ?? -1)).toBe(true);
  expect((b?.zIndex ?? -1) < (c?.zIndex ?? -1)).toBe(true);
  expect(c?.isTop).toBe(true);
  // Restored activities remain settled despite the reordered new push.
  expect(a?.transitionState).toEqual("enter-done");
  expect(b?.transitionState).toEqual("enter-done");
});

test("load - 원본 이벤트의 id·activityId·stepId를 바이트 보존하고 eventDate만 재기저합니다", () => {
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

  // id / activityId / stepId preserved byte-for-byte.
  expect(a?.id).toEqual("a1");
  expect(a?.enteredBy.id).toEqual("e1");
  expect(a?.steps[1].id).toEqual("s2");
  expect(a?.steps[1].enteredBy.id).toEqual("e2");
  // Only eventDate is rebased.
  expect(a?.enteredBy.eventDate).not.toEqual(originalPushDate);
  expect(a?.steps[1].enteredBy.eventDate).not.toEqual(originalStepDate);
});
