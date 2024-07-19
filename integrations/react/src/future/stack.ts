import type {
  ActivityDefinition,
  BaseParams,
  StackflowConfig,
} from "@stackflow/core/future";
import type {
  ActivityComponentType,
  StackComponentType,
  StackflowReactPlugin,
} from "../stable";

type StackflowPluginsEntry =
  | StackflowReactPlugin<never>
  | StackflowPluginsEntry[];

export type StackInput<T extends ActivityDefinition<string, BaseParams>> = {
  config: StackflowConfig<T>;
  components: {
    [activityName in T["name"]]: ActivityComponentType<any>;
  };
  plugins?: Array<StackflowPluginsEntry>;
};

export type StackOutput = {
  /**
   * Created `<Stack />` component
   */
  Stack: StackComponentType;
};

export function stack<T extends ActivityDefinition<string, BaseParams>>({
  config,
}: StackInput<T>): StackOutput {
  throw new Error("UNIMPLEMENTED");
}
