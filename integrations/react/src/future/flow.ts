import type { ActivityDefinition, BaseParams } from "@stackflow/core/future";
import { useCoreActions } from "../__internal__/core";
import { ActivityComponentType } from "../stable";
import { type Actions, makeActions } from "./makeActions";

export type FlowOutput<
  T extends Actions<
    ActivityDefinition<string, BaseParams>,
    {
      [x: string]: ActivityComponentType<any>;
    }
  >,
> = {
  useFlow: () => T;
};

export function flow<
  T extends Actions<
    ActivityDefinition<string, BaseParams>,
    {
      [x: string]: ActivityComponentType<any>;
    }
  >,
>(): FlowOutput<T> {
  return {
    useFlow: () => {
      const coreActions = useCoreActions();
      return makeActions(() => coreActions) as T;
    },
  };
}
