import type { ActivityDefinition } from "./ActivityDefinition";
import type { BaseParams } from "./BaseParams";
import type { StackflowConfigInput } from "./StackflowConfigInput";

export interface StackflowConfig<
  T extends ActivityDefinition<string, BaseParams>,
> extends StackflowConfigInput<T> {
  match: (path: string) => T;
}
