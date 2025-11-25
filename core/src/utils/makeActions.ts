import { aggregate } from "../aggregate";
import type { DomainEvent } from "../event-types";
import { makeEvent } from "../event-utils";
import type { StackflowActions, StackflowPlugin } from "../interfaces";
import type { Stack } from "../Stack";
import { triggerPreEffectHook } from "./triggerPreEffectHooks";

type ActionCreatorOptions = {
  dispatchEvent: StackflowActions["dispatchEvent"];
  pluginInstances: ReturnType<StackflowPlugin>[];
  actions: StackflowActions;
  store: {
    getStack: () => Stack;
    events: { value: DomainEvent[] };
    setStackValue: (stack: Stack) => void;
  };
};

export function makeActions({
  dispatchEvent,
  pluginInstances,
  actions,
  store,
}: ActionCreatorOptions): Omit<StackflowActions, "dispatchEvent" | "getStack"> {
  return {
    push(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "Pushed",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Pushed", nextActionParams);
    },
    replace(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "Replaced",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Replaced", nextActionParams);
    },
    pop(params = {}) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "Popped",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Popped", nextActionParams);
    },
    stepPush(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "StepPushed",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepPushed", nextActionParams);
    },
    stepReplace(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "StepReplaced",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepReplaced", nextActionParams);
    },
    stepPop(params = {}) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "StepPopped",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepPopped", nextActionParams);
    },
    pause(params = {}) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "Paused",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Paused", nextActionParams);
    },
    resume(params = {}) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "Resumed",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Resumed", nextActionParams);
    },
    prune() {
      const { activities } = store.getStack();
      const activeActivities = activities.filter(
        (activity) =>
          activity.transitionState === "enter-active" ||
          activity.transitionState === "enter-done",
      );

      const now = new Date().getTime();

      const newEvents: DomainEvent[] = [
        makeEvent("Initialized", {
          transitionDuration: 0,
          eventDate: now,
        }),
        ...activeActivities.map((activity) =>
          makeEvent("ActivityRegistered", {
            activityName: activity.name,
            eventDate: now,
          }),
        ),
        ...activeActivities.map((activity) =>
          makeEvent("Pushed", {
            activityId: activity.id,
            activityName: activity.name,
            activityParams: activity.params,
            eventDate: now,
            skipEnterActiveState: true,
          }),
        ),
      ];

      store.events.value = newEvents;

      const nextStackValue = aggregate(store.events.value, now);
      store.setStackValue(nextStackValue);
    },
  };
}
