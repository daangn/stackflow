import type { ActivityDefinition } from "./ActivityDefinition";
import type { StackflowConfigInput } from "./StackflowConfigInput";

export interface StackflowConfig<T extends ActivityDefinition<string, {}>>
  extends StackflowConfigInput<T> {
  match: (path: string) => T;
}
