import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useActivityComponentMap } from "../__internal__/ActivityComponentMapProvider";
import { useDataLoader } from "./loader";
import { useConfig } from "./useConfig";

export type Prepare = <K extends RegisteredActivityName>(
  activityName: K,
  activityParams?: InferActivityParams<K>,
) => Promise<void>;

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

    const contentComponent =
      "content" in activityComponentMap[activityName]
        ? activityComponentMap[activityName].content
        : activityComponentMap[activityName];

    if ("_load" in contentComponent) {
      const lazyComponent = contentComponent;

      prefetchTasks.push(Promise.resolve(lazyComponent._load?.()));
    }

    await Promise.all(prefetchTasks);
  };
}
