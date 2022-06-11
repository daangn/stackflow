import { Effect } from "@stackflow/core";
import React, { useCallback, useMemo } from "react";

import { useContext } from "../context";
import { usePlugins } from "../plugins";
import { CoreContext } from "./CoreContext";

export const useCore = () => {
  const plugins = usePlugins();
  const context = useContext();

  const { state, dispatchEvent, getState } = React.useContext(CoreContext);

  const triggerPreEffectHook = useCallback(
    (preEffect: Effect["_TAG"]) => {
      let isPrevented = false;

      const preventDefault = () => {
        isPrevented = true;
      };

      plugins.forEach((plugin) => {
        switch (preEffect) {
          case "PUSHED":
            plugin.onBeforePush?.({
              actions: {
                dispatchEvent,
                getState,
                preventDefault,
              },
              context,
            });
            break;
          case "REPLACED":
            plugin.onBeforeReplace?.({
              actions: {
                dispatchEvent,
                getState,
                preventDefault,
              },
              context,
            });
            break;
          case "POPPED":
            plugin.onBeforePop?.({
              actions: {
                dispatchEvent,
                getState,
                preventDefault,
              },
              context,
            });
            break;
          default:
            break;
        }
      });

      return { isPrevented };
    },
    [plugins, dispatchEvent, getState, context],
  );

  const push = useCallback(
    ({
      activityId,
      activityName,
      params,
    }: {
      activityId: string;
      activityName: string;
      params: { [key: string]: string };
    }) => {
      const { isPrevented } = triggerPreEffectHook("PUSHED");

      if (!isPrevented) {
        dispatchEvent("Pushed", {
          activityId,
          activityName,
          params,
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
      const { isPrevented } = triggerPreEffectHook("REPLACED");

      if (!isPrevented) {
        dispatchEvent("Replaced", {
          activityId,
          activityName,
          params,
        });
      }
    },
    [dispatchEvent],
  );

  const pop = useCallback(() => {
    const { isPrevented } = triggerPreEffectHook("POPPED");

    if (!isPrevented) {
      dispatchEvent("Popped", {});
    }
  }, [dispatchEvent]);

  return useMemo(
    () => ({
      state,
      dispatchEvent,
      getState,
      push,
      replace,
      pop,
    }),
    [state, dispatchEvent, getState, push, replace, pop],
  );
};
