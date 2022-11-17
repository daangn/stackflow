import type { Effect } from "@stackflow/core";
import type {
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "@stackflow/core/dist/event-types";
import type { BaseDomainEvent } from "@stackflow/core/dist/event-types/_base";
import React, { useCallback, useMemo } from "react";

import { useInitContext } from "../init-context";
import { usePlugins } from "../plugins";
import { CoreActionsContext } from "./CoreActionsContext";

export const useCoreActions = () => {
  const plugins = usePlugins();
  const initContext = useInitContext();

  const { dispatchEvent, getStack } = React.useContext(CoreActionsContext);

  const push = useCallback(
    (params: Omit<PushedEvent, keyof BaseDomainEvent>) => {
      // eslint-disable-next-line no-use-before-define
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "PUSHED",
        params,
      );

      if (!isPrevented) {
        dispatchEvent("Pushed", {
          ...eventParams,
        });
      }
    },
    [dispatchEvent],
  );

  const replace = useCallback(
    (params: Omit<ReplacedEvent, keyof BaseDomainEvent>) => {
      // eslint-disable-next-line no-use-before-define
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "REPLACED",
        params,
      );

      if (!isPrevented) {
        dispatchEvent("Replaced", {
          ...eventParams,
        });
      }
    },
    [dispatchEvent],
  );

  const pop = useCallback(
    (params?: Omit<PoppedEvent, keyof BaseDomainEvent>) => {
      const initialParams = params ?? {};

      // eslint-disable-next-line no-use-before-define
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "POPPED",
        initialParams,
      );

      if (!isPrevented) {
        dispatchEvent("Popped", { ...eventParams });
      }
    },
    [dispatchEvent],
  );

  const stepPush = useCallback(
    (params: Omit<StepPushedEvent, keyof BaseDomainEvent>) => {
      // eslint-disable-next-line no-use-before-define
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "STEP_PUSHED",
        params,
      );

      if (!isPrevented) {
        dispatchEvent("StepPushed", {
          ...eventParams,
        });
      }
    },
    [dispatchEvent],
  );

  const stepReplace = useCallback(
    (params: Omit<StepReplacedEvent, keyof BaseDomainEvent>) => {
      // eslint-disable-next-line no-use-before-define
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "STEP_REPLACED",
        params,
      );

      if (!isPrevented) {
        dispatchEvent("StepReplaced", {
          ...eventParams,
        });
      }
    },
    [dispatchEvent],
  );

  const stepPop = useCallback(
    (params?: Omit<StepPoppedEvent, keyof BaseDomainEvent>) => {
      const initialParams = params ?? {};

      // eslint-disable-next-line no-use-before-define
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "STEP_POPPED",
        initialParams,
      );

      if (!isPrevented) {
        dispatchEvent("StepPopped", { ...eventParams });
      }
    },
    [dispatchEvent],
  );

  const coreActions = useMemo(
    () => ({
      dispatchEvent,
      getStack,
      push,
      replace,
      pop,
      stepPush,
      stepReplace,
      stepPop,
    }),
    [
      dispatchEvent,
      getStack,
      push,
      replace,
      pop,
      stepPush,
      stepReplace,
      stepPop,
    ],
  );

  const triggerPreEffectHook = useCallback(
    (preEffect: Effect["_TAG"], initialActionParams: any) => {
      let isPrevented = false;
      let actionParams = {
        ...initialActionParams,
      };

      const preventDefault = () => {
        isPrevented = true;
      };
      const overrideActionParams = (newActionParams: any) => {
        actionParams = {
          ...actionParams,
          ...newActionParams,
        };
      };

      plugins.forEach((plugin) => {
        switch (preEffect) {
          case "PUSHED":
            plugin.onBeforePush?.({
              actionParams,
              actions: {
                ...coreActions,
                preventDefault,
                overrideActionParams,
              },
            });
            break;
          case "REPLACED":
            plugin.onBeforeReplace?.({
              actionParams,
              actions: {
                ...coreActions,
                preventDefault,
                overrideActionParams,
              },
            });
            break;
          case "POPPED":
            plugin.onBeforePop?.({
              actionParams,
              actions: {
                ...coreActions,
                preventDefault,
                overrideActionParams,
              },
            });
            break;
          case "STEP_PUSHED":
            plugin.onBeforeStepPush?.({
              actionParams,
              actions: {
                ...coreActions,
                preventDefault,
                overrideActionParams,
              },
            });
            break;
          case "STEP_REPLACED":
            plugin.onBeforeStepReplace?.({
              actionParams,
              actions: {
                ...coreActions,
                preventDefault,
                overrideActionParams,
              },
            });
            break;
          case "STEP_POPPED":
            plugin.onBeforeStepPop?.({
              actionParams,
              actions: {
                ...coreActions,
                preventDefault,
                overrideActionParams,
              },
            });
            break;
          default:
            break;
        }
      });

      return {
        isPrevented,
        params: actionParams,
      };
    },
    [plugins, initContext],
  );

  return coreActions;
};
