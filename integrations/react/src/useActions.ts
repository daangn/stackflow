import { useMemo } from "react";

import { ActivityComponentType, makeActivityId } from "./activity";
import { BaseActivities } from "./BaseActivities";
import { useCoreActions } from "./core";

export type UseActionsOutputType<T extends BaseActivities> = {
  push: <V extends Extract<keyof T, string>>(
    activityName: V,
    params: T[V] extends ActivityComponentType<infer U> ? U : {},
    options?: {
      animate?: boolean;
    },
  ) => void;
  replace: <V extends Extract<keyof T, string>>(
    activityName: V,
    params: T[V] extends ActivityComponentType<infer U> ? U : {},
    options?: {
      animate?: boolean;
    },
  ) => void;
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
        coreActions.pop();
      },
    }),
    [coreActions.push, coreActions.replace, coreActions.pop],
  );
}
