import type { ActivityDefinition } from "./ActivityDefinition";
import type { BaseParams } from "./BaseParams";
import type { StackflowConfig } from "./StackflowConfig";
import type { StackflowConfigInput } from "./StackflowConfigInput";
import { type UrlPatternOptions, makeTemplate } from "./makeTemplate";

export function createConfig<
  Activity extends ActivityDefinition<string, BaseParams>,
>(
  config: StackflowConfigInput<Activity>,
  options?: { urlPatternOptions?: UrlPatternOptions },
): StackflowConfig<Activity> {
  return {
    ...config,
    match(path) {
      const activities = config.activities.map((activity) => ({
        ...activity,
        template: makeTemplate(activity.path, options?.urlPatternOptions),
      }));

      for (const activity of activities) {
        const params = activity.template.parse(path);

        if (!params) {
          continue;
        }

        return {
          activity,
          params,
        };
      }

      return null;
    },
  };
}
