import { makeEvent, produceEffects } from "@stackflow/core";
import { PushedEvent } from "@stackflow/core/dist/event-types";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { StackContextProvider } from "stack/StackContextProvider";
import { useStackContext } from "stack/useStackContext";

import {
  ActivityComponentType,
  ActivityProvider,
  makeActivityId,
} from "./activity";
import { CoreProvider, useCore } from "./core";
import {
  PluginsProvider,
  StackflowPlugin,
  StackflowPluginHook,
  StackflowPluginPostEffectHook,
  usePlugins,
} from "./plugin";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type BaseActivities = {
  [activityName: string]: ActivityComponentType<any>;
};

export type StackProps<T extends BaseActivities, C extends {} = {}> = {
  fallbackActivityName?: Extract<keyof T, string>;
  context?: C;
};

export type StackflowOptions<T extends BaseActivities> = {
  activities: T;
  transitionDuration: number;
  plugins?: StackflowPlugin[];
};

export function stackflow<T extends BaseActivities>(
  options: StackflowOptions<T>,
) {
  interface PluginRendererProps {
    plugin: WithRequired<ReturnType<StackflowPlugin>, "render">;
  }
  const PluginRenderer: React.FC<PluginRendererProps> = ({ plugin }) => {
    const core = useCore();
    const plugins = usePlugins();

    return plugin.render({
      activities: core.state.activities.map((activity) => ({
        key: activity.id,
        render() {
          const ActivityComponent = options.activities[activity.name];

          let output = (
            <ActivityProvider key={activity.id} activityId={activity.id}>
              <ActivityComponent {...activity.params} />
            </ActivityProvider>
          );

          plugins.forEach((p) => {
            output =
              p.wrapActivity?.({
                activity: {
                  render: () => output,
                },
              }) ?? output;
          });

          return output;
        },
      })),
    });
  };

  const Main: React.FC = () => {
    const core = useCore();
    const plugins = usePlugins();
    const stackContext = useStackContext();

    const prevStateRef = useRef(core.state);

    const onInit = useCallback<StackflowPluginHook>((actions) => {
      plugins.forEach((plugin) => {
        plugin.onInit?.(actions);
      });
    }, []);

    const onEffect = useCallback<StackflowPluginPostEffectHook<any>>(
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
        actions: {
          dispatchEvent: core.dispatchEvent,
          getState() {
            return core.stateRef.current;
          },
        },
        stackContext,
      });
    }, []);

    useEffect(() => {
      const prevState = prevStateRef.current;
      const effects = prevState ? produceEffects(prevState, core.state) : [];

      effects.forEach((effect) => {
        onEffect({
          actions: {
            dispatchEvent: core.dispatchEvent,
            getState() {
              return core.stateRef.current;
            },
          },
          effect,
          stackContext,
        });
      });

      prevStateRef.current = { ...core.state };
    }, [core.state, core.dispatchEvent]);

    return (
      <>
        {plugins
          .filter(
            (plugin): plugin is WithRequired<typeof plugin, "render"> =>
              !!plugin.render,
          )
          .map((plugin) => (
            <PluginRenderer key={plugin.key} plugin={plugin} />
          ))}
      </>
    );
  };

  const initialEventDate = new Date().getTime() - MINUTE;

  const Stack: React.FC<StackProps<T>> = (props) => {
    const plugins = useMemo(
      () => (options.plugins ?? []).map((plugin) => plugin()),
      [],
    );
    const stackContext = props.context ?? {};

    const initialEvents = useMemo(() => {
      const initialPushedEvent =
        plugins.reduce<PushedEvent | null>(
          (acc, plugin) =>
            plugin.overrideInitialPushedEvent?.({
              stackContext,
            }) ?? acc,
          null,
        ) ??
        (props.fallbackActivityName
          ? makeEvent("Pushed", {
              activityId: makeActivityId(),
              activityName: props.fallbackActivityName,
              params: {},
              eventDate: initialEventDate,
            })
          : null);

      const events = [
        makeEvent("Initialized", {
          transitionDuration: options.transitionDuration,
          eventDate: initialEventDate,
        }),
        ...Object.keys(options.activities).map((activityName) =>
          makeEvent("ActivityRegistered", {
            activityName,
            eventDate: initialEventDate,
          }),
        ),
        ...(initialPushedEvent ? [initialPushedEvent] : []),
      ];

      return events;
    }, []);

    let output = (
      <PluginsProvider plugins={plugins}>
        <CoreProvider initialEvents={initialEvents}>
          <StackContextProvider context={stackContext}>
            <Main />
          </StackContextProvider>
        </CoreProvider>
      </PluginsProvider>
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
    const { dispatchEvent, stateRef } = useCore();
    const plugins = usePlugins();
    const stackContext = useStackContext();

    return useMemo(
      () => ({
        push<V extends Extract<keyof T, string>>(
          activityName: V,
          params: T[V] extends ActivityComponentType<infer U> ? U : {},
        ) {
          dispatchEvent("Pushed", {
            activityId: makeActivityId(),
            activityName,
            params,
          });
        },
        replace<V extends Extract<keyof T, string>>(
          activityName: V,
          params: T[V] extends ActivityComponentType<infer U> ? U : {},
        ) {
          dispatchEvent("Replaced", {
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
                dispatchEvent,
                getState() {
                  return stateRef.current;
                },
                preventDefault,
              },
              stackContext,
            });
          });

          if (!isPrevented) {
            dispatchEvent("Popped", {});
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
