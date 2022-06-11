import { Effect } from "@stackflow/core";
import React, { useCallback, useMemo } from "react";

import { useContext } from "../context";
import { usePlugins } from "../plugins";
import { CoreActionsContext } from "./CoreActionsContext";

export const useCoreActions = () => {
  const plugins = usePlugins();
  const context = useContext();

  const { dispatchEvent, getState } = React.useContext(CoreActionsContext);

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
            });
            break;
          case "REPLACED":
            plugin.onBeforeReplace?.({
              actions: {
                dispatchEvent,
                getState,
                preventDefault,
              },
            });
            break;
          case "POPPED":
            plugin.onBeforePop?.({
              actions: {
                dispatchEvent,
                getState,
                preventDefault,
              },
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
      dispatchEvent,
      getState,
      push,
      replace,
      pop,
    }),
    [dispatchEvent, getState, push, replace, pop],
  );
};
