import type { Effect } from "@stackflow/core";
import type {
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
} from "@stackflow/core/dist/event-types";
import type { BaseDomainEvent } from "@stackflow/core/dist/event-types/_base";
import React, { useCallback, useMemo } from "react";

import { useInitContext } from "../init-context";
import { usePlugins } from "../plugins";
import { CoreActionsContext } from "./CoreActionsContext";

const copy = (obj: unknown) => JSON.parse(JSON.stringify(obj));

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

  const coreActions = useMemo(
    () => ({
      dispatchEvent,
      getStack,
      push,
      replace,
      pop,
    }),
    [dispatchEvent, getStack, push, replace, pop],
  );

  const triggerPreEffectHook = useCallback(
    (preEffect: Effect["_TAG"], initialActionParams: unknown) => {
      let isPrevented = false;
      let actionParams = copy(initialActionParams);

      const preventDefault = () => {
        isPrevented = true;
      };
      const overrideActionParams = (newActionParams: unknown) => {
        actionParams = copy(newActionParams);
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
