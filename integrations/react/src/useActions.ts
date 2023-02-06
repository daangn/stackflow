import { useMemo } from "react";

import type { ActivityComponentType } from "./activity";
import { makeActivityId } from "./activity";
import type { BaseActivities } from "./BaseActivities";
import { useCoreActions } from "./core";
import { useTransition } from "./shims";

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

export type UseActionsOutputType<T extends BaseActivities> = {
  /**
   * Is transition pending
   */
  pending: boolean;

  /**
   * Push new activity
   */
  push: <K extends Extract<keyof T, string>>(
    activityName: K,
    params: T[K] extends
      | ActivityComponentType<infer U>
      | { component: ActivityComponentType<infer U> }
      ? U
      : {},
    options?: {
      animate?: boolean;
    },
  ) => {
    activityId: string;
  };

  /**
   * Push new activity in the top and remove current top activity when new activity is activated
   */
  replace: <K extends Extract<keyof T, string>>(
    activityName: K,
    params: T[K] extends
      | ActivityComponentType<infer U>
      | { component: ActivityComponentType<infer U> }
      ? U
      : {},
    options?: {
      animate?: boolean;
      activityId?: string;
    },
  ) => {
    activityId: string;
  };

  /**
   * Remove top activity
   */
  pop: (options?: { animate?: boolean }) => void;
};

export function useActions<
  T extends BaseActivities,
>(): UseActionsOutputType<T> {
  const coreActions = useCoreActions();
  const [pending] = useTransition();

  return useMemo(
    () => ({
      pending,
      push(activityName, activityParams, options) {
        const activityId = makeActivityId();

        coreActions?.push({
          activityId,
          activityName,
          activityParams,
          skipEnterActiveState: parseActionOptions(options).skipActiveState,
        });

        return {
          activityId,
        };
      },
      replace(activityName, activityParams, options) {
        const activityId = makeActivityId();

        coreActions?.replace({
          activityId: options?.activityId ?? makeActivityId(),
          activityName,
          activityParams,
          skipEnterActiveState: parseActionOptions(options).skipActiveState,
        });

        return {
          activityId,
        };
      },
      pop(options) {
        coreActions?.pop({
          skipExitActiveState: parseActionOptions(options).skipActiveState,
        });
      },
    }),
    [coreActions?.push, coreActions?.replace, coreActions?.pop, pending],
  );
}
