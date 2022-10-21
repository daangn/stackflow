import React, { useMemo, useRef } from "react";

import type { BaseActivities } from "./BaseActivities";
import { CoreProvider } from "./core";
import type { StackRefCurrentType } from "./createStackRef";
import { createStackRef } from "./createStackRef";
import EffectManager from "./EffectManager";
import { InitContextProvider } from "./init-context";
import MainRenderer from "./MainRenderer";
import { PluginsProvider } from "./plugins";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import StackRefManager from "./StackRefManager";
import type { UseActionsOutputType } from "./useActions";
import { useActions } from "./useActions";

export type StackProps = {
  /**
   * Context data to pass to plugins in render time
   */
  initContext?: {};
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

  /**
   * Created Ref from useFlow and useActions
   */
  createStackRef: () => React.MutableRefObject<StackRefCurrentType<T>> & {
    isReady: () => boolean;
  };
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

  if (typeof window !== "undefined") {
    const html = window.document.documentElement;

    html.style.setProperty(
      "--stackflow-transition-duration",
      `${options.transitionDuration}ms`,
    );
  }

  return {
    Stack: React.forwardRef<
      StackRefCurrentType<BaseActivities> | undefined,
      StackProps
    >((props, ref) => {
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

      const stackRef = useRef<StackRefCurrentType<BaseActivities>>();
      React.useImperativeHandle(
        ref,
        React.useCallback(() => stackRef?.current, []),
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
              <StackRefManager ref={stackRef} />
            </CoreProvider>
          </PluginsProvider>
        </InitContextProvider>
      );
    }),
    useFlow: useActions,
    createStackRef,
  };
}
