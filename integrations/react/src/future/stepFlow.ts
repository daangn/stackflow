import type {
  ActivityBaseSchema,
  ActivityDefinition,
  Config,
  InferActivityParams,
} from "@stackflow/config";
import { useCoreActions } from "../__internal__/core";
import { type StepActions, makeStepActions } from "./makeStepActions";

export type StepFlowInput<
  T extends ActivityDefinition<string, ActivityBaseSchema>,
> = {
  config: Config<T>;
};

export type StepFlowOutput<
  T extends ActivityDefinition<string, ActivityBaseSchema>,
> = {
  useStepFlow: <K extends T["name"]>(
    activityName: K,
  ) => StepActions<InferActivityParams<T>>;
};

export function stepFlow<
  T extends ActivityDefinition<string, ActivityBaseSchema>,
>(input: StepFlowInput<T>): StepFlowOutput<T> {
  return {
    useStepFlow: () => {
      const coreActions = useCoreActions();
      return makeStepActions(() => coreActions);
    },
  };
}
