import type { CoreStore } from "@stackflow/core";
import type { ActivityDefinition, BaseParams } from "@stackflow/core/future";
import { makeActivityId } from "../__internal__/activity";

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

export type Actions<T extends ActivityDefinition<string, BaseParams>> = {
  /**
   * Push new activity
   */
  push<K extends T["name"]>(
    activityName: K,
    params: NonNullable<Extract<T, { name: K }>["paramTypes"]>,
    options?: {
      animate?: boolean;
    },
  ): {
    activityId: string;
  };

  /**
   * Push new activity in the top and remove current top activity when new activity is activated
   */
  replace<K extends T["name"]>(
    activityName: K,
    params: NonNullable<Extract<T, { name: K }>["paramTypes"]>,
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
  pop(options: { animate?: boolean }): void;
  pop(count: number, options?: { animate?: boolean }): void;
};

export function makeActions<T extends ActivityDefinition<string, BaseParams>>(
  getCoreActions: () => CoreStore["actions"] | undefined,
): Actions<T> {
  return {
    push(activityName, activityParams, options) {
      const activityId = makeActivityId();

      getCoreActions()?.push({
        activityId,
        activityName,
        activityParams: activityParams as any,
        skipEnterActiveState: parseActionOptions(options).skipActiveState,
      });

      return {
        activityId,
      };
    },
    replace(activityName, activityParams, options) {
      const activityId = makeActivityId();

      getCoreActions()?.replace({
        activityId: options?.activityId ?? makeActivityId(),
        activityName,
        activityParams: activityParams as any,
        skipEnterActiveState: parseActionOptions(options).skipActiveState,
      });

      return {
        activityId,
      };
    },
    pop(
      count?: number | { animate?: boolean } | undefined,
      options?: { animate?: boolean } | undefined,
    ) {
      let _count = 1;
      let _options: { animate?: boolean } = {};

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
        };
      }

      for (let i = 0; i < _count; i += 1) {
        getCoreActions()?.pop({
          skipExitActiveState:
            i === 0 ? parseActionOptions(_options).skipActiveState : true,
        });
      }
    },
  };
}
