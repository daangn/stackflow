import { makeEvent } from "../event-utils";
import type { Activity } from "../Stack";
import { makeActivityReducer } from "./makeActivityReducer";

function makeActivity(): Activity {
  const pushedEvent = makeEvent("Pushed", {
    activityId: "a1",
    activityName: "sample",
    activityParams: { page: "1" },
  });

  const stepPushedEvent = makeEvent("StepPushed", {
    stepId: "s2",
    stepParams: { page: "2" },
  });

  return {
    id: "a1",
    name: "sample",
    transitionState: "enter-done",
    params: { page: "2" },
    enteredBy: pushedEvent,
    steps: [
      {
        id: "a1",
        params: { page: "1" },
        enteredBy: pushedEvent,
        zIndex: -1,
      },
      {
        id: "s2",
        params: { page: "2" },
        enteredBy: stepPushedEvent,
        zIndex: -1,
      },
    ],
    isTop: true,
    isActive: true,
    isRoot: true,
    zIndex: 0,
  };
}

test("makeActivityReducer - StepPopped는 activity.steps를 변경하지 않고 새 배열을 반환합니다", () => {
  const activity = makeActivity();
  const originalSteps = activity.steps;

  const reducer = makeActivityReducer({ transitionDuration: 300, now: 0 });
  const stepPoppedEvent = makeEvent("StepPopped", {});

  const nextActivity = reducer(activity, stepPoppedEvent);

  expect(activity.steps).toBe(originalSteps);
  expect(activity.steps.length).toBe(2);
  expect(nextActivity.steps).not.toBe(originalSteps);
  expect(nextActivity.steps.length).toBe(1);
  expect(nextActivity.params).toEqual({ page: "1" });
});
