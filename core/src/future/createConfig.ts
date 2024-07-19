import type { ActivityDefinition } from "./ActivityDefinition";
import type { BaseParams } from "./BaseParams";
import type { StackflowConfig } from "./StackflowConfig";
import type { StackflowConfigInput } from "./StackflowConfigInput";

export function createConfig<
  Activity extends ActivityDefinition<string, BaseParams>,
>(config: StackflowConfigInput<Activity>): StackflowConfig<Activity> {
  return {
    ...config,
    match() {
      throw new Error("UNIMPLEMENTED");
    },
  };
}
