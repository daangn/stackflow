import type {
  ActivityDefinition,
  BaseParams,
  StackflowConfig,
} from "@stackflow/core/future";
import type { StackflowReactPlugin } from "../../__internal__/StackflowReactPlugin";

export function loaderPlugin(
  config: StackflowConfig<ActivityDefinition<string, BaseParams>>,
): StackflowReactPlugin {
  return () => ({
    key: "plugin-loader",
    overrideInitialEvents({ initialEvents }) {
      if (initialEvents.length === 0) {
        return [];
      }

      return initialEvents.map((event) => {
        if (event.name !== "Pushed") {
          return event;
        }

        const { activityName, activityParams } = event;

        const loader = config.activities.find(
          (activity) => activity.name === activityName,
        )?.loader;

        if (!loader) {
          return event;
        }

        const loaderData = loader({
          params: activityParams,
        });

        return {
          ...event,
          activityContext: {
            ...event.activityContext,
            loaderData,
          },
        };
      });
    },
    onBeforePush({ actionParams, actions: { overrideActionParams } }) {
      const { activityName, activityParams, activityContext } = actionParams;

      const loader = config.activities.find(
        (activity) => activity.name === activityName,
      )?.loader;

      if (!loader) {
        return;
      }

      const loaderData = loader({
        params: activityParams,
      });

      overrideActionParams({
        ...actionParams,
        activityContext: {
          ...activityContext,
          loaderData,
        },
      });
    },
    onBeforeReplace({ actionParams, actions: { overrideActionParams } }) {
      const { activityName, activityParams, activityContext } = actionParams;

      const loader = config.activities.find(
        (activity) => activity.name === activityName,
      )?.loader;

      if (!loader) {
        return;
      }

      const loaderData = loader({
        params: activityParams,
      });

      overrideActionParams({
        ...actionParams,
        activityContext: {
          ...activityContext,
          loaderData,
        },
      });
    },
  });
}
