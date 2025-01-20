import type {
  ActivityBaseParams,
  ActivityDefinition,
  Config,
} from "@stackflow/config";
import {
  type CoreStore,
  type PushedEvent,
  makeCoreStore,
  makeEvent,
} from "@stackflow/core";
import React, { useMemo, useReducer } from "react";
import MainRenderer from "../__internal__/MainRenderer";
import { makeActivityId } from "../__internal__/activity";
import { CoreProvider } from "../__internal__/core";
import { PluginsProvider } from "../__internal__/plugins";
import { isBrowser, makeRef } from "../__internal__/utils";
import type { ActivityComponentType, StackflowReactPlugin } from "../stable";
import type { Actions } from "./Actions";
import { ActivityComponentMapProvider } from "./ActivityComponentMapProvider";
import { ConfigProvider } from "./ConfigProvider";
import type { StackComponentType } from "./StackComponentType";
import type { StepActions } from "./StepActions";
import { loaderPlugin } from "./loader";
import { makeActions } from "./makeActions";
import { makeStepActions } from "./makeStepActions";

export type StackflowPluginsEntry =
  | StackflowReactPlugin<never>
  | StackflowPluginsEntry[];

export type StackflowInput<
  T extends ActivityDefinition<string>,
  R extends {
    [activityName in T["name"]]: ActivityComponentType<any>;
  },
> = {
  config: Config<T>;
  components: R;
  plugins?: Array<StackflowPluginsEntry>;
};

export type StackflowOutput = {
  Stack: StackComponentType;
  actions: Actions;
  stepActions: StepActions<ActivityBaseParams>;
};

export function stackflow<
  T extends ActivityDefinition<string>,
  R extends {
    [activityName in T["name"]]: ActivityComponentType<any>;
  },
>(input: StackflowInput<T, R>): StackflowOutput {
  const plugins = [
    ...(input.plugins ?? [])
      .flat(Number.POSITIVE_INFINITY as 0)
      .map((p) => p as StackflowReactPlugin),

    /**
     * `loaderPlugin()` must be placed after `historySyncPlugin()`
     */
    loaderPlugin(input.config),
  ];

  const enoughPastTime = () =>
    new Date().getTime() - input.config.transitionDuration * 2;

  const staticCoreStore = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: input.config.transitionDuration,
        eventDate: enoughPastTime(),
      }),
      ...input.config.activities.map((activity) =>
        makeEvent("ActivityRegistered", {
          activityName: activity.name,
          eventDate: enoughPastTime(),
        }),
      ),
    ],
    plugins: [],
  });

  const [getCoreStore, setCoreStore] = makeRef<CoreStore>();

  const Stack: StackComponentType = React.memo((props) => {
    const initialContext = useMemo(
      () => ({
        ...props.initialContext,
        ...(props.initialLoaderData
          ? {
              initialLoaderData: props.initialLoaderData,
            }
          : null),
      }),
      [],
    );

    const coreStore = useMemo(() => {
      const prevCoreStore = getCoreStore();

      /**
       * In a browser environment,
       * memoize `coreStore` so that only one `coreStore` exists throughout the entire app.
       */
      if (isBrowser() && prevCoreStore) {
        return prevCoreStore;
      }

      const initialPushedEventsByOption = input.config.initialActivity
        ? [
            makeEvent("Pushed", {
              activityId: makeActivityId(),
              activityName: input.config.initialActivity(),
              activityParams: {},
              eventDate: enoughPastTime(),
              skipEnterActiveState: false,
            }),
          ]
        : [];

      const store = makeCoreStore({
        initialEvents: [
          ...staticCoreStore.pullEvents(),
          ...initialPushedEventsByOption,
        ],
        initialContext,
        plugins,
        handlers: {
          onInitialActivityIgnored: (initialPushedEvents) => {
            console.warn(
              `Stackflow - Some plugin overrides an "initialActivity" option. The "initialActivity" option you set to "${
                (initialPushedEvents[0] as PushedEvent).activityName
              }" in the "stackflow" is ignored.`,
            );
          },
          onInitialActivityNotFound: () => {
            console.warn(
              "Stackflow -" +
                " There is no initial activity." +
                " If you want to set the initial activity," +
                " add the `initialActivity` option of the `stackflow()` function or" +
                " add a plugin that sets the initial activity. (e.g. `@stackflow/plugin-history-sync`)",
            );
          },
        },
      });

      if (isBrowser()) {
        store.init();
        setCoreStore(store);
      }

      return store;
    }, []);

    const [activityComponentMap, setActivityComponentMap] = useReducer<
      React.Reducer<
        { [activityName: string]: ActivityComponentType<any> },
        { activityName: string; Component: ActivityComponentType<any> }
      >
    >(
      (map, { activityName, Component }) => ({
        ...map,
        [activityName]: Component,
      }),
      input.components,
    );

    return (
      <ActivityComponentMapProvider
        value={{ activityComponentMap, setActivityComponentMap }}
      >
        <ConfigProvider value={input.config}>
          <PluginsProvider value={coreStore.pluginInstances}>
            <CoreProvider coreStore={coreStore}>
              <MainRenderer
                activityComponentMap={activityComponentMap}
                initialContext={initialContext}
              />
            </CoreProvider>
          </PluginsProvider>
        </ConfigProvider>
      </ActivityComponentMapProvider>
    );
  });

  Stack.displayName = "Stack";

  return {
    Stack,
    actions: makeActions(() => getCoreStore()?.actions),
    stepActions: makeStepActions(() => getCoreStore()?.actions),
  };
}
