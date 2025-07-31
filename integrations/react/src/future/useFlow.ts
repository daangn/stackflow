import type { RegisteredActivityName } from "@stackflow/config";
import { useEffect } from "react";
import { useCoreActions } from "../__internal__/core";
import type { Actions } from "./Actions";
import { useActivityComponentMap } from "./ActivityComponentMapProvider";
import { makeActions } from "./makeActions";
import { useDataLoader } from "./stackflow";
import { useConfig } from "./useConfig";

export type FlowOutput = {
  useFlow: () => Actions;
};

export interface UseFlowOptions {
  relatedActivities?: RegisteredActivityName[];
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

  if (options?.relatedActivities) {
    for (const activityName of options.relatedActivities) {
      actions.prepare(activityName);
    }
  }

  return actions;
}
