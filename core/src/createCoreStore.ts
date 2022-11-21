/* eslint-disable no-use-before-define */

import { aggregate } from "./aggregate";
import type { Effect } from "./Effect";
import type { DomainEvent } from "./event-types";
import { makeEvent } from "./event-utils";
import type { StackflowActions, StackflowPlugin } from "./interfaces";
import { produceEffects } from "./produceEffects";

export function createCoreStore(options: {
  initialEvents: DomainEvent[];
  plugins: StackflowPlugin[];
}): {
  actions: StackflowActions;
} {
  const events = [...options.initialEvents];
  const stack = {
    value: aggregate(events, new Date().getTime()),
  };

  const plugins = options.plugins.map((plugin) => plugin());

  const dispatchEvent: StackflowActions["dispatchEvent"] = (name, params) => {
    const newEvent = makeEvent(name, params);

    const { isPrevented } = triggerPreEffectHooks(newEvent, plugins);

    if (isPrevented) {
      return;
    }

    const nextStackValue = aggregate(
      [...events, newEvent],
      new Date().getTime(),
    );
    const effects = produceEffects(stack.value, nextStackValue);

    events.push(newEvent);
    stack.value = nextStackValue;

    triggerPostEffectHooks(effects, plugins);
  };

  function triggerPreEffectHooks(
    event: DomainEvent,
    plugins: ReturnType<StackflowPlugin>[],
  ) {
    let isPrevented = false;
    let __event: DomainEvent = {
      ...event,
    };

    const preventDefault = () => {
      isPrevented = true;
    };
    const overrideActionParams = (nextActionParams: any) => {
      __event = {
        ...__event,
        ...nextActionParams,
      };
    };

    plugins.forEach((plugin) => {
      switch (__event.name) {
        case "Pushed": {
          plugin.onBeforePush?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "Replaced": {
          plugin.onBeforeReplace?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "Popped": {
          plugin.onBeforePop?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "StepPushed": {
          plugin.onBeforeStepPush?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "StepReplaced": {
          plugin.onBeforeStepReplace?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "StepPopped": {
          plugin.onBeforeStepPop?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        default:
          break;
      }
    });

    return {
      isPrevented,
    };
  }

  function triggerPostEffectHooks(
    effects: Effect[],
    plugins: ReturnType<StackflowPlugin>[],
  ) {
    effects.forEach((effect) => {
      plugins.forEach((plugin) => {
        switch (effect._TAG) {
          case "PUSHED":
            return plugin.onPushed?.({
              actions,
              effect,
            });
          case "REPLACED":
            return plugin.onReplaced?.({
              actions,
              effect,
            });
          case "POPPED":
            return plugin.onPopped?.({
              actions,
              effect,
            });
          case "STEP_PUSHED":
            return plugin.onStepPushed?.({
              actions,
              effect,
            });
          case "STEP_REPLACED":
            return plugin.onStepReplaced?.({
              actions,
              effect,
            });
          case "STEP_POPPED":
            return plugin.onStepPopped?.({
              actions,
              effect,
            });
          case "%SOMETHING_CHANGED%":
            return plugin.onChanged?.({
              actions,
              effect,
            });
          default:
            return undefined;
        }
      });
    });
  }

  const actions: StackflowActions = {
    getStack() {
      return stack.value;
    },
    dispatchEvent,
    push(params) {
      dispatchEvent("Pushed", params);
    },
    replace(params) {
      dispatchEvent("Replaced", params);
    },
    pop(params) {
      dispatchEvent("Popped", params ?? {});
    },
    stepPush(params) {
      dispatchEvent("StepPushed", params);
    },
    stepReplace(params) {
      dispatchEvent("StepReplaced", params);
    },
    stepPop(params) {
      dispatchEvent("StepPopped", params ?? {});
    },
  };

  return {
    actions,
  };
}
