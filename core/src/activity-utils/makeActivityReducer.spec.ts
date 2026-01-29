import { makeEvent } from "../event-utils";
import type { Activity } from "../Stack";
import { makeActivityFromEvent } from "./makeActivityFromEvent";
import { makeActivityReducer } from "./makeActivityReducer";

const SECOND = 1000;
const TRANSITION_DURATION = 350;

let dt = 0;
const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - 60 * SECOND).getTime() + dt;
};

function createActivity(
  overrides: Partial<Activity> & { id?: string } = {},
): Activity {
  const pushedEvent = makeEvent("Pushed", {
    activityId: overrides.id ?? "a1",
    activityName: "TestActivity",
    activityParams: {},
    eventDate: enoughPastTime(),
  });

  return {
    ...makeActivityFromEvent(pushedEvent, "enter-done"),
    ...overrides,
  };
}

describe("makeActivityReducer", () => {
  describe("Replaced", () => {
    test("transition state가 exit-done으로 변경됩니다", () => {
      const activity = createActivity();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      const replacedEvent = makeEvent("Replaced", {
        activityId: "a2",
        activityName: "NewActivity",
        activityParams: { page: "1" },
        eventDate: enoughPastTime(),
      });
      const result = reducer(activity, replacedEvent);

      expect(result.transitionState).toBe("exit-done");
      expect(result.exitedBy).toBe(replacedEvent);
    });
  });

  describe("Popped", () => {
    test("충분한 시간이 지났으면 exit-done으로 전이됩니다", () => {
      const activity = createActivity();
      const eventDate = enoughPastTime();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: eventDate + TRANSITION_DURATION + 1,
      });

      const poppedEvent = makeEvent("Popped", { eventDate });
      const result = reducer(activity, poppedEvent);

      expect(result.transitionState).toBe("exit-done");
      expect(result.exitedBy).toBe(poppedEvent);
    });

    test("전이 시간 내이면 exit-active 상태입니다", () => {
      const activity = createActivity();
      const eventDate = Date.now();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: eventDate + 100,
      });

      const poppedEvent = makeEvent("Popped", { eventDate });
      const result = reducer(activity, poppedEvent);

      expect(result.transitionState).toBe("exit-active");
    });

    test("skipExitActiveState가 true이면 즉시 exit-done으로 전이됩니다", () => {
      const activity = createActivity();
      const eventDate = Date.now();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: eventDate + 1,
      });

      const poppedEvent = makeEvent("Popped", {
        skipExitActiveState: true,
        eventDate,
      });
      const result = reducer(activity, poppedEvent);

      expect(result.transitionState).toBe("exit-done");
    });

    test("exit-done일 때 params와 steps가 첫 번째 step으로 리셋됩니다", () => {
      const activity = createActivity();
      const stepReducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      const stepEvent = makeEvent("StepPushed", {
        stepId: "s1",
        stepParams: { tab: "detail" },
        eventDate: enoughPastTime(),
      });
      const activityWithStep = stepReducer(activity, stepEvent);

      expect(activityWithStep.steps).toHaveLength(2);
      expect(activityWithStep.params).toEqual({ tab: "detail" });

      const eventDate = enoughPastTime();
      const popReducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: eventDate + TRANSITION_DURATION + 1,
      });

      const poppedEvent = makeEvent("Popped", { eventDate });
      const result = popReducer(activityWithStep, poppedEvent);

      expect(result.transitionState).toBe("exit-done");
      expect(result.steps).toHaveLength(1);
      expect(result.params).toEqual({});
    });

    test("exit-active일 때 params와 steps가 그대로 유지됩니다", () => {
      const activity = createActivity();
      const stepReducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      const stepEvent = makeEvent("StepPushed", {
        stepId: "s1",
        stepParams: { tab: "detail" },
        eventDate: enoughPastTime(),
      });
      const activityWithStep = stepReducer(activity, stepEvent);

      const eventDate = Date.now();
      const popReducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: eventDate + 1,
      });

      const poppedEvent = makeEvent("Popped", { eventDate });
      const result = popReducer(activityWithStep, poppedEvent);

      expect(result.transitionState).toBe("exit-active");
      expect(result.steps).toHaveLength(2);
      expect(result.params).toEqual({ tab: "detail" });
    });

    test("resumedAt이 있으면 eventDate 대신 resumedAt 기준으로 전이를 판단합니다", () => {
      const eventDate = Date.now();
      const resumedAt = eventDate - TRANSITION_DURATION - 1;
      const activity = createActivity();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: eventDate,
        resumedAt,
      });

      const poppedEvent = makeEvent("Popped", { eventDate });
      const result = reducer(activity, poppedEvent);

      expect(result.transitionState).toBe("exit-done");
    });
  });

  describe("StepPushed", () => {
    test("새 step이 추가됩니다", () => {
      const activity = createActivity();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      const stepEvent = makeEvent("StepPushed", {
        stepId: "s1",
        stepParams: { tab: "detail" },
        eventDate: enoughPastTime(),
      });
      const result = reducer(activity, stepEvent);

      expect(result.steps).toHaveLength(2);
      expect(result.steps[1].id).toBe("s1");
      expect(result.steps[1].params).toEqual({ tab: "detail" });
      expect(result.steps[1].enteredBy).toBe(stepEvent);
    });

    test("activity params가 stepParams로 업데이트됩니다", () => {
      const activity = createActivity();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      const stepEvent = makeEvent("StepPushed", {
        stepId: "s1",
        stepParams: { tab: "detail", sort: "latest" },
        eventDate: enoughPastTime(),
      });
      const result = reducer(activity, stepEvent);

      expect(result.params).toEqual({ tab: "detail", sort: "latest" });
    });

    test("hasZIndex가 step에 반영됩니다", () => {
      const activity = createActivity();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      const withZIndex = makeEvent("StepPushed", {
        stepId: "s1",
        stepParams: {},
        hasZIndex: true,
        eventDate: enoughPastTime(),
      });

      const r1 = reducer(activity, withZIndex);
      expect(r1.steps[1].hasZIndex).toBe(true);

      const withoutZIndex = makeEvent("StepPushed", {
        stepId: "s2",
        stepParams: {},
        eventDate: enoughPastTime(),
      });

      const r2 = reducer(activity, withoutZIndex);
      expect(r2.steps[1].hasZIndex).toBe(false);
    });

    test("여러 step을 순서대로 추가할 수 있습니다", () => {
      let activity = createActivity();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      activity = reducer(
        activity,
        makeEvent("StepPushed", {
          stepId: "s1",
          stepParams: { page: "1" },
          eventDate: enoughPastTime(),
        }),
      );

      activity = reducer(
        activity,
        makeEvent("StepPushed", {
          stepId: "s2",
          stepParams: { page: "2" },
          eventDate: enoughPastTime(),
        }),
      );

      expect(activity.steps).toHaveLength(3);
      expect(activity.steps[0].id).toBe(activity.id);
      expect(activity.steps[1].id).toBe("s1");
      expect(activity.steps[2].id).toBe("s2");
      expect(activity.params).toEqual({ page: "2" });
    });
  });

  describe("StepReplaced", () => {
    test("마지막 step을 교체합니다", () => {
      let activity = createActivity();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      activity = reducer(
        activity,
        makeEvent("StepPushed", {
          stepId: "s1",
          stepParams: { tab: "old" },
          eventDate: enoughPastTime(),
        }),
      );
      const replaceEvent = makeEvent("StepReplaced", {
        stepId: "s1-replaced",
        stepParams: { tab: "new" },
        eventDate: enoughPastTime(),
      });
      const result = reducer(activity, replaceEvent);

      expect(result.steps).toHaveLength(2);
      expect(result.steps[1].id).toBe("s1-replaced");
      expect(result.steps[1].params).toEqual({ tab: "new" });
      expect(result.params).toEqual({ tab: "new" });
    });

    test("step이 하나뿐일 때도 교체됩니다", () => {
      const activity = createActivity();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      const replaceEvent = makeEvent("StepReplaced", {
        stepId: "s-new",
        stepParams: { view: "grid" },
        eventDate: enoughPastTime(),
      });
      const result = reducer(activity, replaceEvent);

      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].id).toBe("s-new");
      expect(result.params).toEqual({ view: "grid" });
    });
  });

  describe("StepPopped", () => {
    test("마지막 step이 제거됩니다", () => {
      let activity = createActivity();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      activity = reducer(
        activity,
        makeEvent("StepPushed", {
          stepId: "s1",
          stepParams: { tab: "detail" },
          eventDate: enoughPastTime(),
        }),
      );

      expect(activity.steps).toHaveLength(2);

      const popEvent = makeEvent("StepPopped", {
        eventDate: enoughPastTime(),
      });
      const result = reducer(activity, popEvent);

      expect(result.steps).toHaveLength(1);
    });

    test("이전 step의 params로 복원됩니다", () => {
      let activity = createActivity();
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      activity = reducer(
        activity,
        makeEvent("StepPushed", {
          stepId: "s1",
          stepParams: { page: "1" },
          eventDate: enoughPastTime(),
        }),
      );

      activity = reducer(
        activity,
        makeEvent("StepPushed", {
          stepId: "s2",
          stepParams: { page: "2" },
          eventDate: enoughPastTime(),
        }),
      );

      expect(activity.params).toEqual({ page: "2" });

      const result = reducer(
        activity,
        makeEvent("StepPopped", { eventDate: enoughPastTime() }),
      );

      expect(result.params).toEqual({ page: "1" });
    });

    test("step을 모두 pop하면 원래 activity params로 돌아옵니다", () => {
      const pushedEvent = makeEvent("Pushed", {
        activityId: "a1",
        activityName: "TestActivity",
        activityParams: { original: "yes" },
        eventDate: enoughPastTime(),
      });
      let activity = makeActivityFromEvent(pushedEvent, "enter-done");
      const reducer = makeActivityReducer({
        transitionDuration: TRANSITION_DURATION,
        now: Date.now(),
      });

      activity = reducer(
        activity,
        makeEvent("StepPushed", {
          stepId: "s1",
          stepParams: { page: "1" },
          eventDate: enoughPastTime(),
        }),
      );

      expect(activity.params).toEqual({ page: "1" });

      const result = reducer(
        activity,
        makeEvent("StepPopped", { eventDate: enoughPastTime() }),
      );

      expect(result.params).toEqual({ original: "yes" });
    });
  });
});
