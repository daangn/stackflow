import React, { useMemo } from "react";

import type { ActivityComponentType } from "./activity";
import { makeActivityId } from "./activity";
import type { BaseActivities } from "./BaseActivities";
import { useCoreActions } from "./core";

function parseActionOptions(options?: { animate?: boolean }) {
  if (!options) {
    return { skipActiveState: false };
  }

  const isNullableAnimateOption =
    options.animate === undefined || options.animate == null;
  if (isNullableAnimateOption) {
    return { skipActiveState: false };
  }

  return { skipActiveState: !options.animate };
}

export type UseNestedActionsOutputType<P> = {
  pending: boolean;
  nestedPush: (params: P, options?: {}) => void;
  nestedReplace: (params: P, options?: {}) => void;
  nestedPop: (options?: {}) => void;
};

const useTransition: () => [boolean, React.TransitionStartFunction] =
  React.useTransition ?? (() => [false, (cb: () => void) => cb()]);

export type UseNestedActions<T extends BaseActivities = {}> = <
  K extends Extract<keyof T, string>,
>(
  activityName: K,
) => UseNestedActionsOutputType<
  T[K] extends ActivityComponentType<infer U> ? U : {}
>;

export const useNestedActions: UseNestedActions = () => {
  const coreActions = useCoreActions();
  const [pending, startTransition] = useTransition();

  return useMemo(
    () => ({
      pending,
      nestedPush(activityParams) {
        startTransition(() => {
          coreActions.nestedPush({
            activityParams,
          });
        });
      },
      nestedReplace(activityParams) {
        startTransition(() => {
          coreActions.nestedReplace({
            activityParams,
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
