import type {
  ActivityComponentType,
  StackflowReactPlugin,
} from "@stackflow/react";
import React from "react";

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
  return ({ initContext }) => ({
    key: "plugin-preload",
    wrapStack({ stack }) {
      return (
        <LoadersProvider loaders={options.loaders}>
          {stack.render()}
        </LoadersProvider>
      );
    },
    overrideInitialPushedEvent({ pushedEvent }) {
      if (!pushedEvent) {
        return null;
      }

      const { activityName, activityParams, activityContext } = pushedEvent;

      const loader = options.loaders[activityName];

      if (!loader) {
        return pushedEvent;
      }

      const preloadRef = loader({
        activityParams,
        activityContext,
        initContext,
        isInitialActivity: true,
      });

      return {
        ...pushedEvent,
        activityContext: {
          ...pushedEvent.activityContext,
          preloadRef,
        },
      };
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
        initContext,
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
        initContext,
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
