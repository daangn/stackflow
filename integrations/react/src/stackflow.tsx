import {
  produceEffects,
  StackflowPluginHook,
  StackflowPluginPostEffectHook,
} from "@stackflow/core";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useStackActions } from "stack/useStackActions";

import {
  ActivityComponentType,
  ActivityProvider,
  makeActivityId,
} from "./activity";
import { PluginsProvider, usePlugins } from "./plugins";
import { StackProvider, useStack } from "./stack";
import { StackContextProvider } from "./stack-context/StackContextProvider";
import { useStackContext } from "./stack-context/useStackContext";
import { StackflowReactPlugin } from "./StackflowReactPlugin";

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type Activities = {
  [activityName: string]: ActivityComponentType<any>;
};

export type StackProps<T extends Activities, C extends {} = {}> = {
  fallbackActivityName?: Extract<keyof T, string>;
  context?: C;
};

export type StackflowOptions<T extends Activities> = {
  activities: T;
  transitionDuration: number;
  plugins?: StackflowReactPlugin[];
};

export function stackflow<T extends Activities>(options: StackflowOptions<T>) {
  interface PluginRendererProps {
    plugin: WithRequired<ReturnType<StackflowReactPlugin>, "renderStack">;
  }
  const PluginRenderer: React.FC<PluginRendererProps> = ({ plugin }) => {
    const stack = useStack();
    const plugins = usePlugins();

    return plugin.renderStack({
      stack: {
        activities: stack.activities.map((activity) => ({
          ...activity,
          key: activity.id,
          render(overrideActivity) {
            const ActivityComponent = options.activities[activity.name];

            let output = (
              <ActivityProvider
                key={activity.id}
                activity={{
                  ...activity,
                  ...overrideActivity,
                }}
              >
                <ActivityComponent {...activity.params} />
              </ActivityProvider>
            );

            plugins.forEach((p) => {
              output =
                p.wrapActivity?.({
                  activity: {
                    ...activity,
                    render: () => output,
                  },
                }) ?? output;
            });

            return output;
          },
        })),
      },
    });
  };

  const Main: React.FC = () => {
    const stack = useStack();
    const stackActions = useStackActions();
    const plugins = usePlugins();
    const stackContext = useStackContext();

    const onInit = useCallback<StackflowPluginHook>((actions) => {
      plugins.forEach((plugin) => {
        plugin.onInit?.(actions);
      });
    }, []);

    const triggerEffect = useCallback<StackflowPluginPostEffectHook<any>>(
      ({ actions, effect }) => {
        switch (effect._TAG) {
          case "PUSHED": {
            plugins.forEach((plugin) =>
              plugin.onPushed?.({ actions, effect, stackContext }),
            );
            break;
          }
          case "POPPED": {
            plugins.forEach((plugin) =>
              plugin.onPopped?.({ actions, effect, stackContext }),
            );
            break;
          }
          case "REPLACED": {
            plugins.forEach((plugin) =>
              plugin.onReplaced?.({ actions, effect, stackContext }),
            );
            break;
          }
          case "%SOMETHING_CHANGED%": {
            plugins.forEach((plugin) =>
              plugin.onChanged?.({ actions, effect, stackContext }),
            );
            break;
          }
          default: {
            break;
          }
        }
      },
      [],
    );

    useEffect(() => {
      onInit?.({
        actions: stackActions,
        stackContext,
      });
    }, []);

    const prevStateRef = useRef(stack);

    useEffect(() => {
      const prevState = prevStateRef.current;
      const effects = prevState ? produceEffects(prevState, stack) : [];

      effects.forEach((effect) => {
        triggerEffect({
          actions: stackActions,
          effect,
          stackContext,
        });
      });

      prevStateRef.current = { ...stack };
    }, [stack, stackActions]);

    return (
      <>
        {plugins
          .filter(
            (plugin): plugin is WithRequired<typeof plugin, "renderStack"> =>
              !!plugin.renderStack,
          )
          .map((plugin) => (
            <PluginRenderer key={plugin.key} plugin={plugin} />
          ))}
      </>
    );
  };

  const Stack: React.FC<StackProps<T>> = (props) => {
    const plugins = useMemo(
      () => (options.plugins ?? []).map((plugin) => plugin()),
      [],
    );

    let output = (
      <StackContextProvider context={props.context ?? {}}>
        <PluginsProvider plugins={plugins}>
          <StackProvider
            activities={options.activities}
            fallbackActivityName={props.fallbackActivityName}
            transitionDuration={options.transitionDuration}
          >
            <Main />
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
    const plugins = usePlugins();
    const stackContext = useStackContext();

    return useMemo(
      () => ({
        push<V extends Extract<keyof T, string>>(
          activityName: V,
          params: T[V] extends ActivityComponentType<infer U> ? U : {},
          options?: {
            animate?: boolean;
          },
        ) {
          stackActions.dispatchEvent("Pushed", {
            activityId: makeActivityId(),
            activityName,
            params,
          });
        },
        replace<V extends Extract<keyof T, string>>(
          activityName: V,
          params: T[V] extends ActivityComponentType<infer U> ? U : {},
        ) {
          stackActions.dispatchEvent("Replaced", {
            activityId: makeActivityId(),
            activityName,
            params,
          });
        },
        pop() {
          let isPrevented = false;

          const preventDefault = () => {
            isPrevented = true;
          };

          plugins.forEach((plugin) => {
            plugin.onBeforePop?.({
              actions: {
                dispatchEvent: stackActions.dispatchEvent,
                getState: stackActions.getState,
                preventDefault,
              },
              stackContext,
            });
          });

          if (!isPrevented) {
            stackActions.dispatchEvent("Popped", {});
          }
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
