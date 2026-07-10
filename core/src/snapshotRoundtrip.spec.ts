import type { DomainEvent } from "./event-types";
import { makeEvent } from "./event-utils";
import type { StackflowPlugin } from "./interfaces";
import { makeCoreStore } from "./makeCoreStore";
import type { StackSnapshot } from "./StackSnapshot";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;

const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

const config = (activityNames: string[]): DomainEvent[] => [
  makeEvent("Initialized", {
    transitionDuration: 350,
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
  (snap: StackSnapshot): StackflowPlugin =>
  () => ({
    key: "provider",
    provideSnapshot: () => snap,
  });

test("load - load 직후 captureSnapshot이 같은 탐색 기록을 재구성하는 스냅샷을 반환합니다", () => {
  const original: StackSnapshot = {
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
      makeEvent("StepPushed", {
        targetActivityId: "b1",
        stepId: "s2",
        stepParams: { step: "2" },
        eventDate: enoughPastTime(),
      }),
    ],
  };

  const first = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [provideSnapshotPlugin(original)],
  });

  const recaptured = first.actions.captureSnapshot();

  const second = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [provideSnapshotPlugin(recaptured)],
  });

  const stack = second.actions.getStack();
  const a = stack.activities.find((x) => x.id === "a1");
  const b = stack.activities.find((x) => x.id === "b1");

  // Same activity column and z-order A→B (observed via zIndex/isTop).
  expect(a?.name).toEqual("A");
  expect(b?.name).toEqual("B");
  expect((a?.zIndex ?? -1) < (b?.zIndex ?? -1)).toBe(true);
  expect(b?.isTop).toBe(true);

  // Same steps on B, including the preserved stepId.
  expect(b?.steps.map((s) => s.id)).toEqual(["b1", "s2"]);
  expect(b?.steps[1].params.step).toEqual("2");
});

test("load - pause 중 큐잉되어 resume되지 않은 항해는 스냅샷에서 제외되어 복원되지 않습니다", () => {
  const source = makeCoreStore({
    initialEvents: [
      ...config(["A", "B"]),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "A",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [],
  });

  source.actions.pause();
  source.actions.push({
    activityId: "b1",
    activityName: "B",
    activityParams: {},
  });

  // Queued behind the pause and never resumed, b1 is quarantined out of the
  // aggregate — not part of the recorded history, so a reload must not
  // resurrect the pending push as a settled activity.
  expect(source.actions.getStack().activities.some((x) => x.id === "b1")).toBe(
    false,
  );

  let captured: StackSnapshot;
  try {
    captured = source.actions.captureSnapshot();
  } finally {
    // Resume so the paused source store settles and its polling interval
    // clears, even when the capture above throws.
    source.actions.resume();
  }

  // The uncommitted queued push is excluded from the snapshot.
  expect(
    captured.events.some((e) => e.name === "Pushed" && e.activityId === "b1"),
  ).toBe(false);

  const restored = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [provideSnapshotPlugin(captured)],
  });

  const stack = restored.actions.getStack();

  // Only the pre-pause activity is restored; b1 is not resurrected.
  expect(stack.activities.map((x) => x.id)).toEqual(["a1"]);
  expect(stack.activities.find((x) => x.id === "a1")?.transitionState).toEqual(
    "enter-done",
  );
  expect(stack.globalTransitionState).toEqual("idle");
});
