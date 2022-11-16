import React, { useMemo } from "react";

import type { ActivityComponentType } from "./activity";
import { makeActivityNestedRouteId } from "./activity";
import type { BaseActivities } from "./BaseActivities";
import { useCoreActions } from "./core";

export type UseNestedActionsOutputType<P> = {
  pending: boolean;
  nestedPush: (params: P, options?: {}) => void;
  nestedReplace: (params: P, options?: {}) => void;
  nestedPop: (options?: {}) => void;
};

export type UseNestedActions<T extends BaseActivities = {}> = <
  K extends Extract<keyof T, string>,
>(
  activityName: K,
) => UseNestedActionsOutputType<
  T[K] extends ActivityComponentType<infer U> ? U : {}
>;

const useTransition: () => [boolean, React.TransitionStartFunction] =
  React.useTransition ?? (() => [false, (cb: () => void) => cb()]);

export const useNestedActions: UseNestedActions = () => {
  const coreActions = useCoreActions();
  const [pending, startTransition] = useTransition();

  return useMemo(
    () => ({
      pending,
      nestedPush(activityParams) {
        const activityNestedRouteId = makeActivityNestedRouteId();

        startTransition(() => {
          coreActions.nestedPush({
            activityNestedRouteId,
            activityNestedRouteParams: activityParams,
          });
        });
      },
      nestedReplace(activityParams) {
        const activityNestedRouteId = makeActivityNestedRouteId();

        startTransition(() => {
          coreActions.nestedReplace({
            activityNestedRouteId,
            activityNestedRouteParams: activityParams,
          });
        });
      },
      nestedPop() {
        startTransition(() => {
          coreActions.nestedPop({});
        });
      },
    }),
    [
      coreActions.nestedPush,
      coreActions.nestedReplace,
      coreActions.nestedPop,
      pending,
      startTransition,
    ],
  );
};
