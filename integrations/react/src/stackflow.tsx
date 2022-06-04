import { makeEvent, produceEffects } from "@stackflow/core";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

import {
  ActivityComponentType,
  ActivityProvider,
  makeActivityId,
} from "./activity";
import { CoreProvider, useCore } from "./core";
import {
  PluginsProvider,
  StackflowPlugin,
  StackflowPluginEffectHook,
  StackflowPluginHook,
  usePlugins,
} from "./plugin";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type BaseActivities = {
  [activityName: string]: ActivityComponentType;
};

export interface StackProps<T extends BaseActivities> {
  initialActivity: Extract<keyof T, string>;
}

type StackflowOptions<T extends BaseActivities> = {
  activities: T;
  transitionDuration: number;
  plugins?: StackflowPlugin[];
};

export function stackflow<T extends BaseActivities>(
  options: StackflowOptions<T>,
) {
  const initialEventDate = new Date().getTime() - MINUTE;

  interface PluginRendererProps {
    plugin: WithRequired<ReturnType<StackflowPlugin>, "render">;
  }
  const PluginRenderer: React.FC<PluginRendererProps> = ({ plugin }) => {
    const core = useCore();

    return plugin.render({
      activities: core.state.activities.map((activity) => ({
        key: activity.id,
        render() {
          const ActivityComponent = options.activities[activity.name];

          return (
            <ActivityProvider key={activity.id} activityId={activity.id}>
              <ActivityComponent />
            </ActivityProvider>
          );
        },
      })),
    });
  };

  interface MainProps {
    plugins: Array<ReturnType<StackflowPlugin>>;
  }
  const Main: React.FC<MainProps> = ({ plugins }) => {
    const core = useCore();

    const prevStateRef = useRef(core.state);

    const onInit = useCallback<StackflowPluginHook>((actions) => {
      plugins.forEach((plugin) => {
        plugin.onInit?.(actions);
      });
    }, []);

    const onEffect = useCallback<StackflowPluginEffectHook<any>>(
      (actions, effect) => {
        switch (effect._TAG) {
          case "PUSHED": {
            plugins.forEach((plugin) => plugin.onPushed?.(actions, effect));
            break;
          }
          case "POPPED": {
            plugins.forEach((plugin) => plugin.onPopped?.(actions, effect));
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
        dispatchEvent: core.dispatchEvent,
        getState() {
          return core.stateRef.current;
        },
      });
    }, []);

    useEffect(() => {
      const prevState = prevStateRef.current;
      const effects = prevState ? produceEffects(prevState, core.state) : [];

      effects.forEach((effect) => {
        onEffect(
          {
            dispatchEvent: core.dispatchEvent,
            getState() {
              return core.stateRef.current;
            },
          },
          effect,
        );
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

  const Stack: React.FC<StackProps<T>> = ({ initialActivity }) => {
    const plugins = useMemo(
      () => (options.plugins ?? []).map((plugin) => plugin()),
      [],
    );

    const initialEvents = useMemo(() => {
      const initialPushedEvent = plugins
        .find((plugin) => plugin.initialPushedEvent)
        ?.initialPushedEvent?.();

      return [
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
        initialPushedEvent ??
          makeEvent("Pushed", {
            activityId: makeActivityId(),
            activityName: initialActivity,
            eventDate: initialEventDate,
          }),
      ];
    }, []);

    return (
      <PluginsProvider plugins={plugins}>
        <CoreProvider initialEvents={initialEvents}>
          <Main plugins={plugins} />
        </CoreProvider>
      </PluginsProvider>
    );
  };

  const useFlow = () => {
    const { dispatchEvent, stateRef } = useCore();
    const { plugins } = usePlugins();

    return useMemo(
      () => ({
        push(activityName: Extract<keyof T, string>) {
          dispatchEvent("Pushed", {
            activityId: makeActivityId(),
            activityName,
          });
        },
        pop() {
          let isPrevented = false;

          const preventDefault = () => {
            isPrevented = true;
          };

          plugins.forEach((plugin) => {
            plugin.onBeforePop?.({
              dispatchEvent,
              getState() {
                return stateRef.current;
              },
              preventDefault,
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
