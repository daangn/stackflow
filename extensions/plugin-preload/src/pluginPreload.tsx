import type {
  ActivityComponentType,
  StackflowReactPlugin,
} from "@stackflow/react";
import React from "react";

import type { Loader } from "./Loader";
import { LoadersProvider } from "./LoadersContext";

type PreloadPluginOptions<T extends { [activityName: string]: unknown }> = {
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

      const { activityName, params, activityContext } = pushedEvent;

      const loader = options.loaders[activityName];

      if (!loader) {
        return pushedEvent;
      }

      const preloadRef = loader({
        activityParams: params,
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
      const { activityName, params, activityContext } = actionParams;

      const loader = options.loaders[activityName];

      if (!loader) {
        return;
      }

      const preloadRef = loader({
        activityParams: params,
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
      const { activityName, params, activityContext } = actionParams;

      const loader = options.loaders[activityName];

      if (!loader) {
        return;
      }

      const preloadRef = loader({
        activityParams: params,
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
