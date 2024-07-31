import type { ActivityDefinition } from "./ActivityDefinition";

export type Config<T extends ActivityDefinition<string>> = {
  activities: T[];
  transitionDuration: number;
  initialActivity?: () => T["name"];
};
