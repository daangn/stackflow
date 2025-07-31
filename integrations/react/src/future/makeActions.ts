import type {
  ActivityDefinition,
  Config,
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { CoreStore } from "@stackflow/core";
import type { ActivityComponentType } from "../__internal__/ActivityComponentType";
import { makeActivityId } from "../__internal__/activity";
import type { Actions } from "./Actions";

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

export function makeActions(
  getConfig: () => Config<ActivityDefinition<RegisteredActivityName>>,
  getCoreActions: () => CoreStore["actions"] | undefined,
  activityComponentMap: {
    [activityName in RegisteredActivityName]: ActivityComponentType<any>;
  },
  loadData: (activityName: string, activityParams: {}) => unknown,
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
    async prepare<K extends RegisteredActivityName>(
      activityName: K,
      activityParams?: InferActivityParams<K>,
    ) {
      const activityConfig = getConfig().activities.find(
        ({ name }) => name === activityName,
      );
      const prefetchTasks: Promise<unknown>[] = [];

      if (!activityConfig)
        throw new Error(`Activity ${activityName} not found`);

      if (activityParams && activityConfig.loader) {
        loadData(activityName, activityParams);
      }

      if ("_load" in activityComponentMap[activityName]) {
        const lazyComponent = activityComponentMap[activityName];

        prefetchTasks.push(Promise.resolve(lazyComponent._load?.()));
      }

      await Promise.all(prefetchTasks);
    },
  };
}
