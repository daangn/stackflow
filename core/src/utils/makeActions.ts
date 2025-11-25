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
      const stack = store.getStack();
      const activeActivities = stack.activities.filter(
        (activity) =>
          activity.transitionState === "enter-active" ||
          activity.transitionState === "enter-done",
      );

      const now = new Date().getTime();

      const originalInitialized = store.events.value.find(
        (e) => e.name === "Initialized",
      );
      const initializedEventDate = originalInitialized?.eventDate ?? now;

      const activityRegisteredEvents = new Map<
        string,
        {
          eventDate: number;
          paramsSchema?: {
            type: "object";
            properties: {
              [key: string]: {
                type: "string";
                enum?: string[];
              };
            };
            required: string[];
          };
        }
      >();
      for (const event of store.events.value) {
        if (event.name === "ActivityRegistered") {
          activityRegisteredEvents.set(event.activityName, {
            eventDate: event.eventDate,
            ...(event.activityParamsSchema
              ? { paramsSchema: event.activityParamsSchema }
              : {}),
          });
        }
      }

      const uniqueActivityNames = [
        ...new Set(activeActivities.map((a) => a.name)),
      ];

      const newEvents: DomainEvent[] = [
        makeEvent("Initialized", {
          transitionDuration: stack.transitionDuration,
          eventDate: initializedEventDate,
        }),
        ...uniqueActivityNames.map((activityName) => {
          const registered = activityRegisteredEvents.get(activityName);
          return makeEvent("ActivityRegistered", {
            activityName,
            eventDate: registered?.eventDate ?? initializedEventDate,
            ...(registered?.paramsSchema
              ? { activityParamsSchema: registered.paramsSchema }
              : {}),
          });
        }),
      ];

      for (const activity of activeActivities) {
        const rootStep = activity.steps[0];
        if (!rootStep) {
          newEvents.push(
            makeEvent("Pushed", {
              activityId: activity.id,
              activityName: activity.name,
              activityParams: activity.params,
              eventDate: activity.enteredBy.eventDate,
              skipEnterActiveState: true,
              ...(activity.context
                ? { activityContext: activity.context }
                : {}),
            }),
          );
          continue;
        }

        newEvents.push(
          makeEvent("Pushed", {
            activityId: activity.id,
            activityName: activity.name,
            activityParams: rootStep.params,
            eventDate: activity.enteredBy.eventDate,
            skipEnterActiveState: true,
            ...(activity.context ? { activityContext: activity.context } : {}),
          }),
        );

        for (const step of activity.steps.slice(1)) {
          const isStepReplaced = step.enteredBy.name === "StepReplaced";
          newEvents.push(
            makeEvent(isStepReplaced ? "StepReplaced" : "StepPushed", {
              stepId: step.id,
              stepParams: step.params,
              eventDate: step.enteredBy.eventDate,
              ...(step.hasZIndex ? { hasZIndex: step.hasZIndex } : {}),
            }),
          );
        }
      }

      store.events.value = newEvents;

      const nextStackValue = aggregate(store.events.value, now);
      store.setStackValue(nextStackValue);
    },
  };
}
