import type { ActivityDefinition } from "./ActivityDefinition";

export type StackflowConfigInput<T extends ActivityDefinition<string, {}>> = {
  activities: T[];
  transitionDuration: number;
  initialActivity?: () => T["name"];
};
