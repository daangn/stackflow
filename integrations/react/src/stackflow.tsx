import type { AggregateOutput, DispatchEvent } from "@stackflow/core";
import React, { useMemo, useRef } from "react";
import RefManager from "RefManager";

import type { BaseActivities } from "./BaseActivities";
import { CoreProvider } from "./core";
import EffectManager from "./EffectManager";
import { InitContextProvider } from "./init-context";
import MainRenderer from "./MainRenderer";
import { PluginsProvider } from "./plugins";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import type { UseActionsOutputType } from "./useActions";
import { useActions } from "./useActions";

export type StackProps = {
  /**
   * Context data to pass to plugins in render time
   */
  initContext?: {};
};

export type CoreRefType = {
  getStack: () => AggregateOutput;
  dispatchEvent: DispatchEvent;
};

export type StackRefType<T extends BaseActivities> =
  | (UseActionsOutputType<T> & CoreRefType & { isReady: true })
  | {
      isReady: false;
    };

export type StackComponentType = React.ForwardRefExoticComponent<
  StackProps & React.RefAttributes<StackRefType<BaseActivities>>
>;

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
   * Created Ref from useFlow and Stack
   */
  createStackRef: () => React.RefObject<StackRefType<T>>;
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
    Stack: React.forwardRef<StackRefType<BaseActivities>, StackProps>(
      (props, ref) => {
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

        const actionRef = useRef<UseActionsOutputType<T>>(null);
        const coreRef = useRef<CoreRefType>(null);

        React.useImperativeHandle(
          ref,
          React.useCallback(() => {
            if (actionRef?.current && coreRef?.current) {
              return {
                ...actionRef.current,
                ...coreRef.current,
                isReady: true as const,
              };
            }
            return {
              isReady: false as const,
            };
          }, [actionRef, coreRef]),
        );

        return (
          <InitContextProvider value={props.initContext ?? {}}>
            <PluginsProvider value={plugins}>
              <CoreProvider
                ref={coreRef}
                activities={activities}
                initialActivity={options.initialActivity}
                transitionDuration={options.transitionDuration}
              >
                <MainRenderer activities={activities} />
                <EffectManager />
                <RefManager ref={actionRef} />
              </CoreProvider>
            </PluginsProvider>
          </InitContextProvider>
        );
      },
    ),
    useFlow: useActions,
    createStackRef() {
      return React.createRef();
    },
  };
}
