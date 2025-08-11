import { useCoreActions } from "../__internal__/core";
import type { Actions } from "./Actions";
import { useActivityComponentMap } from "./ActivityComponentMapProvider";
import { useDataLoader } from "./loader";
import { makeActions } from "./makeActions";
import { useConfig } from "./useConfig";

export type FlowOutput = {
  useFlow: () => Actions;
};

export function useFlow(): Actions {
  const coreActions = useCoreActions();
  const config = useConfig();
  const activityComponentMap = useActivityComponentMap();
  const loadData = useDataLoader();
  const actions = makeActions(
    config,
    () => coreActions,
    activityComponentMap,
    loadData,
  );

  return actions;
}
