import type { DomainEvent } from "../event-types";
import type { BaseDomainEvent } from "../event-types/_base";
import type { StackflowPlugin } from "../interfaces";
import type { StackflowActions } from "../interfaces";
import type { StackflowPluginPreEffectHook } from "../interfaces/StackflowPluginHook";

type PreEffectHookResult<T> = {
  isPrevented: boolean;
  nextActionParams: T;
};

type EventNameToParams<K extends ActionName> = Omit<
  Extract<DomainEvent, { name: K }>,
  keyof BaseDomainEvent
>;

const PLUGIN_HOOK_MAP = {
  Pushed: "onBeforePush",
  Replaced: "onBeforeReplace",
  Popped: "onBeforePop",
  StepPushed: "onBeforeStepPush",
  StepReplaced: "onBeforeStepReplace",
  StepPopped: "onBeforeStepPop",
  Paused: "onBeforePause",
  Resumed: "onBeforeResume",
} as const;

type ActionName = Exclude<
  DomainEvent["name"],
  "Initialized" | "ActivityRegistered"
>;

export function triggerPreEffectHook<K extends ActionName>(
  actionName: K,
  actionParams: EventNameToParams<K>,
  pluginInstances: ReturnType<StackflowPlugin>[],
  actions: StackflowActions,
): PreEffectHookResult<EventNameToParams<K>> {
  let isPrevented = false;
  let nextActionParams = { ...actionParams };

  for (const pluginInstance of pluginInstances) {
    const hook = pluginInstance[PLUGIN_HOOK_MAP[actionName]] as
      | StackflowPluginPreEffectHook<EventNameToParams<K>>
      | undefined;
    if (hook) {
      hook({
        actionParams: { ...nextActionParams },
        actions: {
          ...actions,
          preventDefault: () => {
            isPrevented = true;
          },
          overrideActionParams: (partialActionParams: EventNameToParams<K>) => {
            nextActionParams = {
              ...nextActionParams,
              ...partialActionParams,
            };
          },
        },
      });
    }
  }

  return {
    isPrevented,
    nextActionParams,
  };
}
