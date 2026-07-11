import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useMemo } from "react";
import { useCoreActions } from "./core";
import { makeStepActions } from "./makeStepActions";
import type { StepActions } from "./StepActions";

export function useStepFlow<ActivityName extends RegisteredActivityName>(
  activityName: ActivityName,
): StepActions<InferActivityParams<ActivityName>> {
  const coreActions = useCoreActions();

  return useMemo(() => makeStepActions(() => coreActions), [coreActions]);
}
