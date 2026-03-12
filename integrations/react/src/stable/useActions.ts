import { useMemo } from "react";
import { makeActivityId } from "../__internal__/activity";
import { useCoreActions } from "../__internal__/core";
import type { MonolithicActivityComponentType } from "../__internal__/MonolithicActivityComponentType";
import { useTransition } from "../__internal__/shims";
import type { BaseActivities } from "./BaseActivities";

function parseActionOptions(options?: { animate?: boolean }) {
  if (!options) {
    return { skipActiveState: false };
  }

  const isNullableAnimateOption = options.animate == null;

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
  push<K extends Extract<keyof T, string>>(
    activityName: K,
    params: T[K] extends
      | MonolithicActivityComponentType<infer U>
      | { component: MonolithicActivityComponentType<infer U> }
      ? U
      : {},
    options?: {
      animate?: boolean;
    },
  ): {
    activityId: string;
  };

  /**
   * Push new activity in the top and remove current top activity when new activity is activated
   */
  replace<K extends Extract<keyof T, string>>(
    activityName: K,
    params: T[K] extends
      | MonolithicActivityComponentType<infer U>
      | { component: MonolithicActivityComponentType<infer U> }
      ? U
      : {},
    options?: {
      animate?: boolean;
      activityId?: string;
    },
  ): {
    activityId: string;
  };

  /**
   * Remove top activity
   */
  pop(): void;
  pop(options: { animate?: boolean, skipActiveState?: boolean }): void;
  pop(count: number, options: { animate?: boolean }): void;
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
      pop(
        count?: number | { animate?: boolean, skipActiveState?: boolean } | undefined,
        options?: { animate?: boolean } | undefined,
      ) {
        let _count = 1;
        let _options: { animate?: boolean, skipActiveState?: boolean } = {};

        if (typeof count === "object") {
          _options = {
            ...count,
          };
        }
        if (typeof count === "number") {
          _count = count;
        }
        if (options) {
          _options = {
            ...options,
            skipActiveState: false,
          };
        }

        for (let i = 0; i < _count; i += 1) {
          coreActions?.pop({
            skipExitActiveState: _options.skipActiveState || 
              (i === 0 ? parseActionOptions(_options).skipActiveState : true),
          });
        }
      },
    }),
    [coreActions?.push, coreActions?.replace, coreActions?.pop, pending],
  );
}
