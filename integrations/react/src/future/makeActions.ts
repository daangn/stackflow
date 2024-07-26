import type { CoreStore } from "@stackflow/core";
import type {
  ActivityDefinition,
  ActivityParamTypes,
  BaseParams,
} from "@stackflow/core/future";
import { makeActivityId } from "../__internal__/activity";
import type { ActivityComponentType } from "../stable";

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

export type Actions<
  T extends ActivityDefinition<string, BaseParams>,
  R extends {
    [activityName in T["name"]]: ActivityComponentType<any>;
  },
> = {
  push<K extends T["name"]>(
    activityName: K,
    param: ActivityParamTypes<Extract<T, { name: K }>> &
      R[K] extends ActivityComponentType<infer P>
      ? P
      : never,
    options?: {
      animate?: boolean;
    },
  ): {
    activityId: string;
  };
  replace<K extends T["name"]>(
    activityName: K,
    param: ActivityParamTypes<Extract<T, { name: K }>> &
      R[K] extends ActivityComponentType<infer P>
      ? P
      : never,
    options?: {
      animate?: boolean;
      activityId?: string;
    },
  ): {
    activityId: string;
  };
  pop(): void;
  pop(options: { animate?: boolean }): void;
  pop(count: number, options?: { animate?: boolean }): void;
};

export function makeActions<
  T extends ActivityDefinition<string, BaseParams>,
  R extends {
    [activityName in T["name"]]: ActivityComponentType<any>;
  },
>(getCoreActions: () => CoreStore["actions"] | undefined): Actions<T, R> {
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
