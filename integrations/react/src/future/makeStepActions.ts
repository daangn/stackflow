import type {
  ActivityBaseSchema,
  ActivityDefinition,
  InferActivityParams,
} from "@stackflow/config";
import type { CoreStore } from "@stackflow/core";
import { makeStepId } from "../__internal__/activity";

export type StepActions<Params> = {
  pushStep: (params: Params, options?: {}) => void;
  replaceStep: (params: Params, options?: {}) => void;
  popStep: (options?: {}) => void;
};

export function makeStepActions<
  T extends ActivityDefinition<string, ActivityBaseSchema>,
>(
  getCoreActions: () => CoreStore["actions"] | undefined,
): StepActions<InferActivityParams<T>> {
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
