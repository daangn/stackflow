import type { ActivityDefinition } from "./ActivityDefinition";
import type { Config } from "./Config";
import type { ConfigDefinition } from "./ConfigDefinition";

export function defineConfig<
  ActivityName extends string,
  Activity extends ActivityDefinition<ActivityName>,
>(configDefinition: ConfigDefinition<Activity>): Config<Activity> {
  const config: Config<Activity> = {
    ...configDefinition,
    decorate(key, value) {
      config[key] = value;
    },
  };

  return config;
}
