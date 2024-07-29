import type {
  InferActivityParams,
  RegisteredActivityParamTypes,
} from "@stackflow/config";
import type { CoreStore } from "@stackflow/core";
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

export type Actions = {
  push<K extends keyof RegisteredActivityParamTypes>(
    activityName: K,
    activityParams: InferActivityParams<K>,
    options?: {
      animate?: boolean;
    },
  ): {
    activityId: string;
  };
  replace<K extends keyof RegisteredActivityParamTypes>(
    activityName: K,
    activityParams: InferActivityParams<K>,
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

export function makeActions(
  getCoreActions: () => CoreStore["actions"] | undefined,
): Actions {
  return {
    push(activityName, activityParams, options) {
      const activityId = makeActivityId();

      getCoreActions()?.push({
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

      getCoreActions()?.replace({
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
