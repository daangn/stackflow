import React, { useMemo } from "react";

import { BaseActivities } from "./BaseActivities";
import { CoreProvider } from "./core";
import EffectManager from "./EffectManager";
import { InitContextProvider } from "./init-context";
import MainRenderer from "./MainRenderer";
import { PluginsProvider } from "./plugins";
import { StackflowReactPlugin } from "./StackflowReactPlugin";
import { useActions, UseActionsOutputType } from "./useActions";

export type StackProps<C extends {} = {}> = {
  /**
   * Context data to pass to plugins in render time
   */
  initContext?: C;
};
export type StackComponentType = React.FC<StackProps>;

export type StackflowOptions<T extends BaseActivities> = {
  /**
   * Register activities used in your app
   */
  activities: T;

  /**
   * Transition duration for stack animation (millisecond)
   */
  transitionDuration: number;

  /**
   * Set the first activity to load at the bottom
   * (It can be overwritten by plugin)
   */
  initialActivity?: (args: { initContext: any }) => Extract<keyof T, string>;

  /**
   * Inject stackflow plugins
   */
  plugins?: Array<StackflowReactPlugin<T> | StackflowReactPlugin<T>[]>;
};

export type StackflowOutput<T extends BaseActivities> = {
  /**
   * Created `<Stack />` component
   */
  Stack: StackComponentType;

  /**
   * Created `useFlow()` hooks
   */
  useFlow: () => UseActionsOutputType<T>;
};

/**
 * Make `<Stack />` component and `useFlow()` hooks that strictly typed with `activities`
 */
export function stackflow<T extends BaseActivities>(
  options: StackflowOptions<T>,
): StackflowOutput<T> {
  const activities = Object.entries(options.activities).reduce(
    (acc, [key, Component]) => ({
      ...acc,
      [key]: React.memo(Component),
    }),
    {},
  );

  return {
    Stack(props) {
      const plugins = useMemo(
        () =>
          (options.plugins ?? [])
            .reduce<StackflowReactPlugin[]>(
              (plugins, plugin) => [
                ...plugins,
                ...(Array.isArray(plugin) ? plugin : [plugin]),
              ],
              [],
            )
            .map((plugin) => plugin({ initContext: props.initContext })),
        [],
      );

      return (
        <InitContextProvider value={props.initContext ?? {}}>
          <PluginsProvider value={plugins}>
            <CoreProvider
              activities={activities}
              initialActivity={options.initialActivity}
              transitionDuration={options.transitionDuration}
            >
              <MainRenderer activities={activities} />
              <EffectManager />
            </CoreProvider>
          </PluginsProvider>
        </InitContextProvider>
      );
    },
    useFlow: useActions,
  };
}
