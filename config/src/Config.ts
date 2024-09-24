import type { ActivityDefinition } from "./ActivityDefinition";
import type { ConfigDefinition } from "./ConfigDefinition";

export interface Config<T extends ActivityDefinition<string>>
  extends ConfigDefinition<T> {
  decorate<
    K extends Exclude<keyof Config<T>, keyof ConfigDefinition<T> | "decorate">,
  >(key: K, value: Config<T>[K]): void;
}
