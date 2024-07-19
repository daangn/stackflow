import type {
  ActivityDefinition,
  BaseParams,
  StackflowConfig,
} from "@stackflow/core/future";
import { useCoreActions } from "../__internal__/core";
import { type Actions, makeActions } from "./makeActions";

export type FlowInput<T extends ActivityDefinition<string, BaseParams>> = {
  config: StackflowConfig<T>;
};

export type FlowOutput<T extends ActivityDefinition<string, BaseParams>> = {
  useFlow: () => Actions<T>;
};

export function flow<T extends ActivityDefinition<string, BaseParams>>(
  input: FlowInput<T>,
): FlowOutput<T> {
  return {
    useFlow: () => {
      const coreActions = useCoreActions();
      return makeActions(() => coreActions);
    },
  };
}
