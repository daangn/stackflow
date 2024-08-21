import type { ActivityDefinition } from "./ActivityDefinition";

export interface ConfigDefinition<T extends ActivityDefinition<string>> {
  activities: T[];
  transitionDuration: number;
  initialActivity?: () => T["name"];
}
