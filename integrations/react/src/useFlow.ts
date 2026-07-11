import { useMemo } from "react";
import type { Actions } from "./Actions";
import { useCoreActions } from "./core";
import { makeActions } from "./makeActions";

export type FlowOutput = {
  useFlow: () => Actions;
};

export function useFlow(): Actions {
  const coreActions = useCoreActions();

  return useMemo(() => makeActions(() => coreActions), [coreActions]);
}
