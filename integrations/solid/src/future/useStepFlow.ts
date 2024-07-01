import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useCoreActions } from "../__internal__/core";
import type { StepActions } from "./StepActions";
import { makeStepActions } from "./makeStepActions";

export function useStepFlow<ActivityName extends RegisteredActivityName>(
  activityName: ActivityName,
): StepActions<InferActivityParams<ActivityName>> {
  const coreActions = useCoreActions();
  return makeStepActions(coreActions);
}
