import type { ActivityDefinition, Config } from "@stackflow/config";
import type { StackflowSolidPlugin } from "../../__internal__/StackflowSolidPlugin";

export function loaderPlugin(
  config: Config<ActivityDefinition<string>>,
): StackflowSolidPlugin {
  return () => ({
    key: "plugin-loader",
    overrideInitialEvents({ initialEvents, initialContext }) {
      if (initialEvents.length === 0) {
        return [];
      }

      return initialEvents.map((event) => {
        if (event.name !== "Pushed") {
          return event;
        }

        if (initialContext.initialLoaderData) {
          return {
            ...event,
            activityContext: {
              ...event.activityContext,
              loaderData: initialContext.initialLoaderData,
            },
          };
        }

        const { activityName, activityParams } = event;

        const matchActivity = config.activities.find(
          (activity) => activity.name === activityName,
        );
        const loader = matchActivity?.loader;

        if (!loader) {
          return event;
        }

        const loaderData = loader({
          params: activityParams,
          config,
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
        config,
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
        config,
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
