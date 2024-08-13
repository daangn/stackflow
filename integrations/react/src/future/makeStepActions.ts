import type { ActivityBaseParams } from "@stackflow/config";
import type { CoreStore } from "@stackflow/core";
import { makeStepId } from "../__internal__/activity";
import type { StepActions } from "./StepActions";

export function makeStepActions(
  getCoreActions: () => CoreStore["actions"] | undefined,
): StepActions<ActivityBaseParams> {
  return {
    pushStep(
      stepParams,
      options?: {
        targetActivityId?: string;
      },
    ) {
      const stepId = makeStepId();

      getCoreActions()?.stepPush({
        stepId,
        stepParams,
        targetActivityId: options?.targetActivityId,
      });
    },
    replaceStep(
      stepParams,
      options?: {
        targetActivityId?: string;
      },
    ) {
      const stepId = makeStepId();

      getCoreActions()?.stepReplace({
        stepId,
        stepParams,
        targetActivityId: options?.targetActivityId,
      });
    },
    popStep(options?: {
      targetActivityId?: string;
    }) {
      getCoreActions()?.stepPop({
        targetActivityId: options?.targetActivityId,
      });
    },
  };
}
