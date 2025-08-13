import { useCoreActions } from "../__internal__/core";
import type { Actions } from "./Actions";
import { makeActions } from "./makeActions";

export type FlowOutput = {
  useFlow: () => Actions;
};

export function useFlow(): Actions {
  const coreActions = useCoreActions();
  const actions = makeActions(
    () => coreActions,
  );

  return actions;
}
