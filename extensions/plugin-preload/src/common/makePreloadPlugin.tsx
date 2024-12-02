import type { StackflowPlugin } from "@stackflow/core";

import type { Loader } from "./Loader";
import type { ActivityParams } from "./activityComponentType";

export type PreloadPluginOptions<
  T extends { [activityName: string]: unknown },
> = {
  loaders: {
    [K in Extract<keyof T, string>]?: Loader<ActivityParams<T[K]>>;
  };
};

export const makePreloadPlugin =
  <P extends StackflowPlugin = StackflowPlugin>(
    getOverrides: (args: {
      options: PreloadPluginOptions<Record<string, unknown>>;
    }) => Omit<ReturnType<P>, keyof ReturnType<StackflowPlugin>>,
  ) =>
  <T extends { [activityName: string]: unknown }>(
    options: PreloadPluginOptions<T>,
  ): P => {
    const plugin: StackflowPlugin = () => ({
      key: "plugin-preload",
      overrideInitialEvents({ initialEvents, initialContext }) {
        if (initialEvents.length === 0) {
          return [];
        }

        return initialEvents.map((event) => {
          if (event.name !== "Pushed") {
            return event;
          }

          const { activityName, activityParams, activityContext } = event;

          const loader = options.loaders[activityName] as Loader | undefined;

          if (!loader) {
            return event;
          }

          const preloadRef = loader({
            activityParams,
            activityContext,
            isInitialActivity: true,
            initialContext,
          });

          return {
            ...event,
            activityContext: {
              ...event.activityContext,
              preloadRef,
            },
          };
        });
      },
      onBeforePush({ actionParams, actions: { overrideActionParams } }) {
        const { activityName, activityParams, activityContext } = actionParams;

        const loader = options.loaders[activityName] as Loader | undefined;

        if (!loader) {
          return;
        }

        const preloadRef = loader({
          activityParams,
          activityContext,
        });

        overrideActionParams({
          ...actionParams,
          activityContext: {
            ...activityContext,
            preloadRef,
          },
        });
      },
      onBeforeReplace({ actionParams, actions: { overrideActionParams } }) {
        const { activityName, activityParams, activityContext } = actionParams;

        const loader = options.loaders[activityName] as Loader | undefined;

        if (!loader) {
          return;
        }

        const preloadRef = loader({
          activityParams,
          activityContext,
        });

        overrideActionParams({
          ...actionParams,
          activityContext: {
            ...activityContext,
            preloadRef,
          },
        });
      },
      ...getOverrides({ options }),
    });

    return plugin as P;
  };
