import type {
  ActivityDefinition,
  ActivityParamTypes,
  BaseParams,
  StackflowConfig,
} from "@stackflow/core/future";
import { useCoreActions } from "../__internal__/core";
import { type StepActions, makeStepActions } from "./makeStepActions";

export type StepFlowInput<T extends ActivityDefinition<string, BaseParams>> = {
  config: StackflowConfig<T>;
};

export type StepFlowOutput<T extends ActivityDefinition<string, BaseParams>> = {
  useStepFlow: <K extends T["name"]>(
    activityName: K,
  ) => StepActions<ActivityParamTypes<Extract<T, { name: K }>>>;
};

export function stepFlow<T extends ActivityDefinition<string, BaseParams>>(
  input: StepFlowInput<T>,
): StepFlowOutput<T> {
  return {
    useStepFlow: () => {
      const coreActions = useCoreActions();
      return makeStepActions(() => coreActions);
    },
  };
}
