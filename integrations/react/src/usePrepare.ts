import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useCallback } from "react";
import { useActivityComponentMap } from "./ActivityComponentMapProvider";
import {
  getContentComponent,
  isStructuredActivityComponent,
} from "./StructuredActivityComponentType";
import { useDataLoader } from "./loader";
import type { Prepare } from "./Prepare";
import { useConfig } from "./useConfig";

export function usePrepare(): Prepare {
  const config = useConfig();
  const loadData = useDataLoader();
  const activityComponentMap = useActivityComponentMap();

  return useCallback(
    async function prepare<K extends RegisteredActivityName>(
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
    },
    [config, loadData, activityComponentMap],
  );
}
