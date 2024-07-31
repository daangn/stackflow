import type { ActivityDefinition } from "./ActivityDefinition";
import type { Config } from "./Config";

export function defineConfig<
  ActivityName extends string,
  Activity extends ActivityDefinition<ActivityName>,
>(config: Config<Activity>) {
  return config;
}
