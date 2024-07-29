import type {
  InferActivityParams,
  RegisteredActivityParamTypes,
} from "@stackflow/config";
import { useCoreActions } from "../__internal__/core";
import { type StepActions, makeStepActions } from "./makeStepActions";

export function useStepFlow<K extends keyof RegisteredActivityParamTypes>(
  activityName: K,
): StepActions<InferActivityParams<K>> {
  const coreActions = useCoreActions();
  return makeStepActions(() => coreActions);
}
