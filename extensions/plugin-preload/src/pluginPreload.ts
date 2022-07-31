import { ActivityParams } from "@stackflow/core";
import { StackflowReactPlugin } from "@stackflow/react";

type PreloadPluginOptions<K extends string> = {
  loaders: {
    [activityName in K]: {
      preloadRef?: (args: {
        path: string;
        route: string;
        activityId: string;
        activityName: K;
        activityParams: ActivityParams;
        context: any;
      }) => any;
    };
  };
};

export function preloadPlugin<T extends { [activityName: string]: any }>(
  options: PreloadPluginOptions<Extract<keyof T, string>>,
): StackflowReactPlugin<T> {
  return () => ({
    key: "plugin-preload",
    overrideInitialPushedEvent({ pushedEvent }) {
      return pushedEvent;
    },
    onBeforePush({ actionParams, actions: { overrideActionParams } }) {},
    onBeforeReplace({ actionParams, actions: { overrideActionParams } }) {},
  });
}
