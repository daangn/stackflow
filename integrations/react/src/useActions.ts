import { useMemo } from "react";

import { ActivityComponentType, makeActivityId } from "./activity";
import { BaseActivities } from "./BaseActivities";
import { useCoreActions } from "./core";

export type UseActionsOutputType<T extends BaseActivities> = {
  /**
   * Push new activity
   */
  push: <V extends Extract<keyof T, string>>(
    activityName: V,
    params: T[V] extends ActivityComponentType<infer U> ? U : {},
    options?: {
      animate?: boolean;
    },
  ) => void;

  /**
   * Push new activity in the top and remove current top activity when new activity is activated
   */
  replace: <V extends Extract<keyof T, string>>(
    activityName: V,
    params: T[V] extends ActivityComponentType<infer U> ? U : {},
    options?: {
      animate?: boolean;
    },
  ) => void;

  /**
   * Remove top activity
   */
  pop: (options?: { animate?: boolean }) => void;
};

export function useActions<
  T extends BaseActivities,
>(): UseActionsOutputType<T> {
  const coreActions = useCoreActions();

  return useMemo(
    () => ({
      push(activityName, params, options) {
        coreActions.push({
          activityId: makeActivityId(),
          activityName,
          params,
          options,
        });
      },
      replace(activityName, params, options) {
        coreActions.replace({
          activityId: makeActivityId(),
          activityName,
          params,
        });
      },
      pop(options) {
        coreActions.pop(options);
      },
    }),
    [coreActions.push, coreActions.replace, coreActions.pop],
  );
}
