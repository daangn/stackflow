import type {
  ActivityBaseSchema,
  ActivityDefinition,
  Config,
} from "@stackflow/config";
import { useCoreActions } from "../__internal__/core";
import type { ActivityComponentType } from "../stable";
import { type Actions, makeActions } from "./makeActions";

export type FlowInput<
  T extends ActivityDefinition<string, ActivityBaseSchema>,
> = {
  config: Config<T>;
};

export type FlowOutput<
  T extends ActivityDefinition<string, ActivityBaseSchema>,
> = {
  useFlow: () => Actions<T>;
};

export function flow<T extends ActivityDefinition<string, ActivityBaseSchema>>(
  input: FlowInput<T>,
): FlowOutput<T> {
  return {
    useFlow: () => {
      const coreActions = useCoreActions();
      return makeActions(() => coreActions);
    },
  };
}
