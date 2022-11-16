import type { Effect } from "@stackflow/core";
import type {
  NestedPoppedEvent,
  NestedPushedEvent,
  NestedReplacedEvent,
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
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

  const nestedPush = useCallback(
    (params: Omit<NestedPushedEvent, keyof BaseDomainEvent>) => {
      // eslint-disable-next-line no-use-before-define
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "NESTED_PUSHED",
        params,
      );

      if (!isPrevented) {
        dispatchEvent("NestedPushed", {
          ...eventParams,
        });
      }
    },
    [dispatchEvent],
  );

  const nestedReplace = useCallback(
    (params: Omit<NestedReplacedEvent, keyof BaseDomainEvent>) => {
      // eslint-disable-next-line no-use-before-define
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "NESTED_REPLACED",
        params,
      );

      if (!isPrevented) {
        dispatchEvent("NestedReplaced", {
          ...eventParams,
        });
      }
    },
    [dispatchEvent],
  );

  const nestedPop = useCallback(
    (params?: Omit<NestedPoppedEvent, keyof BaseDomainEvent>) => {
      const initialParams = params ?? {};

      // eslint-disable-next-line no-use-before-define
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "NESTED_POPPED",
        initialParams,
      );

      if (!isPrevented) {
        dispatchEvent("NestedPopped", { ...eventParams });
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
      nestedPush,
      nestedReplace,
      nestedPop,
    }),
    [
      dispatchEvent,
      getStack,
      push,
      replace,
      pop,
      nestedPush,
      nestedReplace,
      nestedPop,
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
          case "NESTED_PUSHED":
            plugin.onBeforeNestedPush?.({
              actionParams,
              actions: {
                ...coreActions,
                preventDefault,
                overrideActionParams,
              },
            });
            break;
          case "NESTED_REPLACED":
            plugin.onBeforeNestedReplace?.({
              actionParams,
              actions: {
                ...coreActions,
                preventDefault,
                overrideActionParams,
              },
            });
            break;
          case "NESTED_POPPED":
            plugin.onBeforeNestedPop?.({
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
