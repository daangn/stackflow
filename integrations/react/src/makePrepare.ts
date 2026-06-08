import type {
  ActivityDefinition,
  Config,
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ActivityComponentType } from "./BaseActivityComponentType";
import type { Prepare } from "./Prepare";
import {
  getContentComponent,
  isStructuredActivityComponent,
} from "./StructuredActivityComponentType";

export type MakePrepareInput = {
  config: Config<ActivityDefinition<RegisteredActivityName>>;
  loadData: (activityName: string, activityParams: {}) => unknown;
  activityComponentMap: {
    [activityName in RegisteredActivityName]: ActivityComponentType;
  };
};

export function makePrepare({
  config,
  loadData,
  activityComponentMap,
}: MakePrepareInput): Prepare {
  return async function prepare<K extends RegisteredActivityName>(
    activityName: K,
    activityParams?: InferActivityParams<K>,
  ) {
    const activityConfig = config.activities.find(
      ({ name }) => name === activityName,
    );
    const prefetchTasks: Promise<unknown>[] = [];

    if (!activityConfig)
      throw new Error(`Activity ${activityName} is not registered.`);

    if (activityParams && activityConfig.loader) {
      prefetchTasks.push(
        Promise.resolve(loadData(activityName, activityParams)),
      );
    }

    if ("_load" in activityComponentMap[activityName]) {
      prefetchTasks.push(
        Promise.resolve(activityComponentMap[activityName]._load?.()),
      );
    }

    if (
      isStructuredActivityComponent(activityComponentMap[activityName]) &&
      typeof activityComponentMap[activityName].content === "function"
    ) {
      prefetchTasks.push(
        getContentComponent(activityComponentMap[activityName]).preload(),
      );
    }

    await Promise.all(prefetchTasks);
  };
}
