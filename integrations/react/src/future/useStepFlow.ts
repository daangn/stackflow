import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useCoreActions } from "../__internal__/core";
import { makeStepActions } from "./makeStepActions";
import type { StepActions } from "./StepActions";

export function useStepFlow<ActivityName extends RegisteredActivityName>(
  activityName: ActivityName,
): StepActions<InferActivityParams<ActivityName>> {
  const coreActions = useCoreActions();

  return makeStepActions(() => coreActions);
}
