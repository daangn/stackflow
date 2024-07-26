import type { ActivityBaseSchema } from "./ActivityBaseSchema";
import type { ActivityDefinition } from "./ActivityDefinition";

export type Config<T extends ActivityDefinition<string, ActivityBaseSchema>> = {
  activities: T[];
  transitionDuration: number;
  initialActivity?: () => T["name"];
};
