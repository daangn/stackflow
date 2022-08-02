import React, { useMemo } from "react";

import { ActivityComponentType, makeActivityId } from "./activity";
import { BaseActivities } from "./BaseActivities";
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
    params: T[K] extends ActivityComponentType<infer U> ? U : {},
    options?: {
      animate?: boolean;
    },
  ) => void;

  /**
   * Push new activity in the top and remove current top activity when new activity is activated
   */
  replace: <K extends Extract<keyof T, string>>(
    activityName: K,
    params: T[K] extends ActivityComponentType<infer U> ? U : {},
    options?: {
      animate?: boolean;
    },
  ) => void;

  /**
   * Remove top activity
   */
  pop: (options?: { animate?: boolean }) => void;
};

const useTransition: () => [boolean, React.TransitionStartFunction] =
  React.useTransition ?? (() => [false, (cb: () => void) => cb()]);

export function useActions<
  T extends BaseActivities,
>(): UseActionsOutputType<T> {
  const coreActions = useCoreActions();
  const [pending, startTransition] = useTransition();

  return useMemo(
    () => ({
      pending,
      push(activityName, params, options) {
        if (pending) {
          return;
        }
        startTransition(() => {
          coreActions.push({
            activityId: makeActivityId(),
            activityName,
            params,
            skipEnterActiveState: parseActionOptions(options).skipActiveState,
          });
        });
      },
      replace(activityName, params, options) {
        if (pending) {
          return;
        }
        startTransition(() => {
          coreActions.replace({
            activityId: makeActivityId(),
            activityName,
            params,
            skipEnterActiveState: parseActionOptions(options).skipActiveState,
          });
        });
      },
      pop(options) {
        if (pending) {
          return;
        }
        startTransition(() => {
          coreActions.pop({
            skipExitActiveState: parseActionOptions(options).skipActiveState,
          });
        });
      },
    }),
    [
      coreActions.push,
      coreActions.replace,
      coreActions.pop,
      pending,
      startTransition,
    ],
  );
}
