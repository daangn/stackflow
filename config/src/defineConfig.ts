import type { ActivityDefinition } from "./ActivityDefinition";
import type { Config } from "./Config";
import type { ConfigDefinition } from "./ConfigDefinition";

export function defineConfig<
  ActivityName extends string,
  Activity extends ActivityDefinition<ActivityName>,
>(config: ConfigDefinition<Activity>): Config<Activity> {
  return config;
}
