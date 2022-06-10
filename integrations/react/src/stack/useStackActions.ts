import { Effect } from "@stackflow/core";
import { useCallback, useContext, useMemo } from "react";

import { usePlugins } from "../plugins";
import { useStackContext } from "../stack-context";
import { StackContext } from "./StackContext";

export const useStackActions = () => {
  const plugins = usePlugins();
  const stackContext = useStackContext();

  const { dispatchEvent, getState } = useContext(StackContext);

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
              stackContext,
            });
            break;
          case "REPLACED":
            plugin.onBeforeReplace?.({
              actions: {
                dispatchEvent,
                getState,
                preventDefault,
              },
              stackContext,
            });
            break;
          case "POPPED":
            plugin.onBeforePop?.({
              actions: {
                dispatchEvent,
                getState,
                preventDefault,
              },
              stackContext,
            });
            break;
          default:
            break;
        }
      });

      return { isPrevented };
    },
    [plugins, dispatchEvent, getState, stackContext],
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
