import { usePlugins } from "plugins";
import { useCallback, useContext, useMemo } from "react";
import { useStackContext } from "stack-context";

import { StackContext } from "./StackContext";

export const useStackActions = () => {
  const plugins = usePlugins();
  const stackContext = useStackContext();

  const { dispatchEvent, getState } = useContext(StackContext);

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
      dispatchEvent("Pushed", {
        activityId,
        activityName,
        params,
      });
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
      dispatchEvent("Replaced", {
        activityId,
        activityName,
        params,
      });
    },
    [dispatchEvent],
  );

  const pop = useCallback(() => {
    let isPrevented = false;

    const preventDefault = () => {
      isPrevented = true;
    };

    plugins.forEach((plugin) => {
      plugin.onBeforePop?.({
        actions: {
          dispatchEvent,
          getState,
          preventDefault,
        },
        stackContext,
      });
    });

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
