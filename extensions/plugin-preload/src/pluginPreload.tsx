import type {
  ActivityComponentType,
  StackflowReactPlugin,
} from "@stackflow/react";

import type { Loader } from "./Loader";
import { LoadersProvider } from "./LoadersContext";

export type PreloadPluginOptions<
  T extends { [activityName: string]: unknown },
> = {
  loaders: {
    [key in Extract<keyof T, string>]?: T[key] extends ActivityComponentType<
      infer U
    >
      ? Loader<U>
      : Loader<{}>;
  };
};

export function preloadPlugin<T extends { [activityName: string]: unknown }>(
  options: PreloadPluginOptions<T>,
): StackflowReactPlugin<T> {
  return () => ({
    key: "plugin-preload",
    wrapStack({ stack }) {
      return (
        <LoadersProvider loaders={options.loaders}>
          {stack.render()}
        </LoadersProvider>
      );
    },
    overrideInitialEvents({ initialEvents, initialContext }) {
      if (initialEvents.length === 0) {
        return [];
      }

      return initialEvents.map((event) => {
        if (event.name !== "Pushed") {
          return event;
        }

        const { activityName, activityParams, activityContext } = event;

        const loader = options.loaders[activityName];

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

      const loader = options.loaders[activityName];

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

      const loader = options.loaders[activityName];

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
  });
}
