import { InferActivityParams, RegisteredActivityName } from "@stackflow/config"
import { useConfig } from "./useConfig";
import { useDataLoader } from "./loader";
import { useActivityComponentMap } from "../__internal__/ActivityComponentMapProvider";

export type Prepare =<K extends RegisteredActivityName>(
  activityName: K,
  activityParams?: InferActivityParams<K>,
) => Promise<void>

export function usePrepare(): Prepare {
  const config = useConfig();
  const loadData = useDataLoader();
  const activityComponentMap = useActivityComponentMap();

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
      const lazyComponent = activityComponentMap[activityName];

      prefetchTasks.push(Promise.resolve(lazyComponent._load?.()));
    }

    await Promise.all(prefetchTasks);
  };
}