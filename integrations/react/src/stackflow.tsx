import React, { useMemo } from "react";

import { ActivityComponentType, makeActivityId } from "./activity";
import { ContextProvider } from "./context";
import { CoreProvider, useCore } from "./core";
import EffectManager from "./EffectManager";
import MainRenderer from "./MainRenderer";
import { PluginsProvider } from "./plugins";
import { StackflowReactPlugin } from "./StackflowReactPlugin";

export type Activities = {
  [activityName: string]: ActivityComponentType<any>;
};

export type StackProps<C extends {} = {}> = {
  context?: C;
};

export type StackflowOptions<T extends Activities> = {
  activities: T;
  transitionDuration: number;
  initialActivity?: (args: { context: any }) => Extract<keyof T, string>;
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
  };

  const useFlow = () => {
    const core = useCore();

    return useMemo(
      () => ({
        push<V extends Extract<keyof T, string>>(
          activityName: V,
          params: T[V] extends ActivityComponentType<infer U> ? U : {},
          options?: {
            animate?: boolean;
          },
        ) {
          core.push({
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
          core.replace({
            activityId: makeActivityId(),
            activityName,
            params,
          });
        },
        pop(options?: { animate?: boolean }) {
          core.pop();
        },
      }),
      [core.push, core.replace, core.pop],
    );
  };

  return {
    Stack,
    useFlow,
  };
}
