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
