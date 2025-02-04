import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useContext } from "react";
import { ActivityContext } from "../__internal__/activity";
import { useCoreActions } from "../__internal__/core";
import type { StepActions } from "./StepActions";
import { makeStepActions } from "./makeStepActions";

export function useStepFlow<ActivityName extends RegisteredActivityName>(
  activityName: ActivityName,
): StepActions<InferActivityParams<ActivityName>> {
  const coreActions = useCoreActions();
  const { id } = useContext(ActivityContext);

  return makeStepActions(
    () => coreActions,
    (activities) => activities.find((activity) => activity.id === id),
  );
}
