import type { ActivityDefinition } from "./ActivityDefinition";
import type { ConfigDefinition } from "./ConfigDefinition";

export interface Config<T extends ActivityDefinition<string>>
  extends ConfigDefinition<T> {}
