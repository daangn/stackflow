import { ActivityComponentType, StackflowReactPlugin } from "@stackflow/react";
import React from "react";

import { Loader } from "./Loader";
import { LoadersProvider } from "./LoadersContext";

type PreloadPluginOptions<
  T extends { [activityName: string]: ActivityComponentType },
> = {
  loaders: {
    [key in Extract<keyof T, string>]: T[key] extends ActivityComponentType<
      infer U
    >
      ? Loader<U>
      : never;
  };
};

export function preloadPlugin<T extends { [activityName: string]: any }>(
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

      const { activityName, params, eventContext } = pushedEvent;

      const loader = options.loaders[activityName];

      const preloadRef = loader({
        activityParams: params,
        eventContext,
        initContext,
        isInitialActivity: true,
      });

      return {
        ...pushedEvent,
        preloadRef,
      };
    },
    onBeforePush({ actionParams, actions: { overrideActionParams } }) {
      const { activityName, params, eventContext } = actionParams;

      const loader = options.loaders[activityName];

      const preloadRef = loader({
        activityParams: params,
        eventContext,
        initContext,
      });

      overrideActionParams({
        ...actionParams,
        preloadRef,
      });
    },
    onBeforeReplace({ actionParams, actions: { overrideActionParams } }) {
      const { activityName, params, eventContext } = actionParams;

      const loader = options.loaders[activityName];

      const preloadRef = loader({
        activityParams: params,
        eventContext,
        initContext,
      });

      overrideActionParams({
        ...actionParams,
        preloadRef,
      });
    },
  });
}
