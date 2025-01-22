import type { ActivityDefinition } from "./ActivityDefinition";
import type { RegisteredActivityName } from "./RegisteredActivityName";

export interface ConfigDefinition<
  T extends ActivityDefinition<RegisteredActivityName>,
> {
  activities: T[];
  transitionDuration: number;
  initialActivity?: () => T["name"];
}
