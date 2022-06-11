import React, { useMemo } from "react";

import { ActivityComponentType, makeActivityId } from "./activity";
import EffectManager from "./EffectManager";
import { PluginsProvider } from "./plugins";
import PluginRenderer from "./PluginsRenderer";
import { StackProvider, useStackActions } from "./stack";
import { StackContextProvider } from "./stack-context";
import { StackflowReactPlugin } from "./StackflowReactPlugin";
import { WithRequired } from "./utils";

export type Activities = {
  [activityName: string]: ActivityComponentType<any>;
};

export type StackProps<C extends {} = {}> = {
  context?: C;
};

export type StackflowOptions<T extends Activities> = {
  activities: T;
  transitionDuration: number;
  initialActivity?: (args: { stackContext: any }) => Extract<keyof T, string>;
  plugins?: Array<StackflowReactPlugin | StackflowReactPlugin[]>;
};

export function stackflow<T extends Activities>(options: StackflowOptions<T>) {
  const Stack: React.FC<StackProps> = (props) => {
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
          .map((plugin) => plugin()),
      [],
    );

    let output = (
      <StackContextProvider value={props.context ?? {}}>
        <PluginsProvider value={plugins}>
          <StackProvider
            activities={options.activities}
            initialActivity={options.initialActivity}
            transitionDuration={options.transitionDuration}
          >
            {plugins
              .filter(
                (
                  plugin,
                ): plugin is WithRequired<typeof plugin, "renderStack"> =>
                  !!plugin.renderStack,
              )
              .map((plugin) => (
                <PluginRenderer
                  activities={options.activities}
                  key={plugin.key}
                  plugin={plugin}
                />
              ))}
            <EffectManager />
          </StackProvider>
        </PluginsProvider>
      </StackContextProvider>
    );

    plugins.forEach((plugin) => {
      output =
        plugin.wrapStack?.({
          stack: {
            render: () => output,
          },
        }) ?? output;
    });

    return output;
  };

  const useFlow = () => {
    const stackActions = useStackActions();

    return useMemo(
      () => ({
        push<V extends Extract<keyof T, string>>(
          activityName: V,
          params: T[V] extends ActivityComponentType<infer U> ? U : {},
          options?: {
            animate?: boolean;
          },
        ) {
          stackActions.push({
            activityId: makeActivityId(),
            activityName,
            params,
          });
        },
        replace<V extends Extract<keyof T, string>>(
          activityName: V,
          params: T[V] extends ActivityComponentType<infer U> ? U : {},
          options?: {
            animate?: boolean;
          },
        ) {
          stackActions.replace({
            activityId: makeActivityId(),
            activityName,
            params,
          });
        },
        pop(options?: { animate?: boolean }) {
          stackActions.pop();
        },
      }),
      [dispatchEvent],
    );
  };

  return {
    Stack,
    useFlow,
  };
}
