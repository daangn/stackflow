import { ActivityParams } from "@stackflow/core";
import { StackflowReactPlugin } from "@stackflow/react";

type PreloadPluginOptions<K extends string> = {
  loaders: {
    [activityName in K]: (args: {
      activityId: string;
      activityParams: ActivityParams;
      initContext: any;
      eventContext: any;
    }) => any;
  };
};

export function preloadPlugin<T extends { [activityName: string]: any }>(
  options: PreloadPluginOptions<Extract<keyof T, string>>,
): StackflowReactPlugin<T> {
  return ({ initContext }) => ({
    key: "plugin-preload",
    overrideInitialPushedEvent({ pushedEvent }) {
      if (!pushedEvent) {
        return null;
      }

      const { activityId, activityName, params, eventContext } = pushedEvent;

      const loader = options.loaders[activityName];

      const preloadRef = loader({
        activityId,
        activityParams: params,
        eventContext,
        initContext,
      });

      return {
        ...pushedEvent,
        preloadRef,
      };
    },
    onBeforePush({ actionParams, actions: { overrideActionParams } }) {
      const { activityId, activityName, params, eventContext } = actionParams;

      const loader = options.loaders[activityName];

      const preloadRef = loader({
        activityId,
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
      const { activityId, activityName, params, eventContext } = actionParams;

      const loader = options.loaders[activityName];

      const preloadRef = loader({
        activityId,
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
