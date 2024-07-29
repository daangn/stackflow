import type {
  InferActivityParams,
  RegisteredActivityParamTypes,
} from "@stackflow/config";
import { useCoreActions } from "../__internal__/core";
import { type StepActions, makeStepActions } from "./makeStepActions";

export function useStepFlow<
  ActivityName extends Extract<keyof RegisteredActivityParamTypes, string>,
>(activityName: ActivityName): StepActions<InferActivityParams<ActivityName>> {
  const coreActions = useCoreActions();
  return makeStepActions(() => coreActions);
}
