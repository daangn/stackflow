import { Effect } from "@stackflow/core";
import React, { useCallback, useMemo } from "react";

import { useContext } from "../context";
import { usePlugins } from "../plugins";
import { CoreActionsContext } from "./CoreActionsContext";

const copy = (obj: unknown) => JSON.parse(JSON.stringify(obj));

export const useCoreActions = () => {
  const plugins = usePlugins();
  const context = useContext();

  const { dispatchEvent, getStack } = React.useContext(CoreActionsContext);

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
                dispatchEvent,
                getStack,
                preventDefault,
                overrideActionParams,
              },
            });
            break;
          case "REPLACED":
            plugin.onBeforeReplace?.({
              actionParams,
              actions: {
                dispatchEvent,
                getStack,
                preventDefault,
                overrideActionParams,
              },
            });
            break;
          case "POPPED":
            plugin.onBeforePop?.({
              actionParams,
              actions: {
                dispatchEvent,
                getStack,
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
    [plugins, dispatchEvent, getStack, context],
  );

  const push = useCallback(
    ({
      activityId,
      activityName,
      params,
      options,
    }: {
      activityId: string;
      activityName: string;
      params: { [key: string]: string };
      options?: { animate?: boolean };
    }) => {
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "PUSHED",
        {
          activityId,
          activityName,
          params,
        },
      );

      const eventOptions = {
        skipEnterActiveState: options && options.animate !== undefined && options.animate != null ? !options.animate : false,
      };

      if (!isPrevented) {
        dispatchEvent("Pushed", {
          ...eventParams,
          ...eventOptions,
        });
      }
    },
    [dispatchEvent],
  );

  const replace = useCallback(
    ({
      activityId,
      activityName,
      params,
    }: {
      activityId: string;
      activityName: string;
      params: { [key: string]: string };
    }) => {
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "REPLACED",
        {
          activityId,
          activityName,
          params,
        },
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
    (options?: { animate?: boolean }) => {
      const { isPrevented, params: eventParams } = triggerPreEffectHook(
        "POPPED",
        {},
      );

      const eventOptions = {
        skipExitActiveState: options && options.animate !== undefined && options.animate != null ? !options.animate : false,
      };

      if (!isPrevented) {
        dispatchEvent("Popped", { ...eventParams, ...eventOptions });
      }
    },
    [dispatchEvent],
  );

  return useMemo(
    () => ({
      dispatchEvent,
      getStack,
      push,
      replace,
      pop,
    }),
    [dispatchEvent, getStack, push, replace, pop],
  );
};
