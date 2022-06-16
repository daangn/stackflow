import React, { useMemo } from "react";

import { BaseActivities } from "./BaseActivities";
import { ContextProvider } from "./context";
import { CoreProvider } from "./core";
import EffectManager from "./EffectManager";
import MainRenderer from "./MainRenderer";
import { PluginsProvider } from "./plugins";
import { StackflowReactPlugin } from "./StackflowReactPlugin";
import { useActions, UseActionsOutputType } from "./useActions";

export type StackProps<C extends {} = {}> = {
  context?: C;
};
export type StackComponentType = React.FC<StackProps>;

export type StackflowOptions<T extends BaseActivities> = {
  activities: T;
  transitionDuration: number;
  initialActivity?: (args: { context: any }) => Extract<keyof T, string>;
  plugins?: Array<StackflowReactPlugin | StackflowReactPlugin[]>;
};
export type StackflowOutput<T extends BaseActivities> = {
  Stack: StackComponentType;
  useFlow: () => UseActionsOutputType<T>;
};

export function stackflow<T extends BaseActivities>(
  options: StackflowOptions<T>,
): StackflowOutput<T> {
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
            .map((plugin) => plugin({ context: props.context })),
        [],
      );

      return (
        <ContextProvider value={props.context ?? {}}>
          <PluginsProvider value={plugins}>
            <CoreProvider
              activities={options.activities}
              initialActivity={options.initialActivity}
              transitionDuration={options.transitionDuration}
            >
              <MainRenderer activities={options.activities} />
              <EffectManager />
            </CoreProvider>
          </PluginsProvider>
        </ContextProvider>
      );
    },
    useFlow: useActions,
  };
}
