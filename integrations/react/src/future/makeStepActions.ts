import type { ActivityBaseParams } from "@stackflow/config";
import type { CoreStore } from "@stackflow/core";
import { makeStepId } from "../__internal__/activity";
import type { StepActions } from "./StepActions";

export function makeStepActions(
  getCoreActions: () => CoreStore["actions"] | undefined,
): StepActions<ActivityBaseParams> {
  return {
    pushStep(stepParams) {
      const stepId = makeStepId();

      getCoreActions()?.stepPush({
        stepId,
        stepParams,
      });
    },
    replaceStep(stepParams) {
      const stepId = makeStepId();

      getCoreActions()?.stepReplace({
        stepId,
        stepParams,
      });
    },
    popStep() {
      getCoreActions()?.stepPop({});
    },
  };
}
