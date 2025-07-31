import type { RegisteredActivityName } from "@stackflow/config";
import { useCoreActions } from "../__internal__/core";
import type { Actions } from "./Actions";
import { useActivityComponentMap } from "./ActivityComponentMapProvider";
import { useDataLoader } from "./loader";
import { makeActions } from "./makeActions";
import { useConfig } from "./useConfig";

export type FlowOutput = {
  useFlow: () => Actions;
};

export interface UseFlowOptions {
  reachableActivities?: RegisteredActivityName[];
}

export function useFlow(options?: UseFlowOptions): Actions {
  const coreActions = useCoreActions();
  const config = useConfig();
  const activityComponentMap = useActivityComponentMap();
  const loadData = useDataLoader();
  const actions = makeActions(
    () => config,
    () => coreActions,
    activityComponentMap,
    loadData,
  );

  if (options?.reachableActivities) {
    for (const activityName of options.reachableActivities) {
      actions.prepare(activityName);
    }
  }

  return actions;
}
