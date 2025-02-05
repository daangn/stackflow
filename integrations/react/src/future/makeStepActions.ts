import type { ActivityBaseParams } from "@stackflow/config";
import type { Activity, CoreStore } from "@stackflow/core";
import { makeStepId } from "../__internal__/activity";
import type { StepActions } from "./StepActions";

export function makeStepActions(
  getCoreActions: () => CoreStore["actions"] | undefined,
  findTargetActivity: (activity: Activity[]) => Activity | undefined,
): StepActions<ActivityBaseParams> {
  return {
    pushStep(stepParams, options) {
      const coreActions = getCoreActions();
      const activities = coreActions?.getStack().activities;
      const targetActivity = activities && findTargetActivity(activities);

      if (!targetActivity) {
        throw new Error(
          "Cannot push a step. The target activity is not found.",
        );
      }

      const nextParams =
        typeof stepParams === "function"
          ? stepParams(targetActivity.params)
          : stepParams;
      const stepId = makeStepId();

      coreActions.stepPush({
        stepId,
        stepParams: nextParams,
        targetActivityId: options?.targetActivityId,
      });
    },
    replaceStep(stepParams, options) {
      const coreActions = getCoreActions();
      const activities = coreActions?.getStack().activities;
      const targetActivity = activities && findTargetActivity(activities);

      if (!targetActivity) {
        throw new Error(
          "Cannot push a step. The target activity is not found.",
        );
      }

      const nextParams =
        typeof stepParams === "function"
          ? stepParams(targetActivity.params)
          : stepParams;
      const stepId = makeStepId();

      coreActions.stepReplace({
        stepId,
        stepParams: nextParams,
        targetActivityId: options?.targetActivityId,
      });
    },
    popStep(options) {
      getCoreActions()?.stepPop({
        targetActivityId: options?.targetActivityId,
      });
    },
  };
}
