import {
  type CoreStore,
  type PushedEvent,
  makeCoreStore,
  makeEvent,
} from "@stackflow/core";
import type {
  ActivityDefinition,
  BaseParams,
  StackflowConfig,
} from "@stackflow/core/future";
import React, { useMemo } from "react";
import MainRenderer from "../__internal__/MainRenderer";
import { makeActivityId } from "../__internal__/activity";
import { CoreProvider } from "../__internal__/core";
import { PluginsProvider } from "../__internal__/plugins";
import { isBrowser, makeRef } from "../__internal__/utils";
import type {
  ActivityComponentType,
  StackComponentType,
  StackflowReactPlugin,
} from "../stable";
import {
  type HistorySyncPluginOptions,
  historySyncPlugin,
} from "./history-sync";
import { loaderPlugin } from "./loader";
import { type Actions, makeActions } from "./makeActions";

export type StackflowPluginsEntry =
  | StackflowReactPlugin<never>
  | StackflowPluginsEntry[];

export type StackInput<T extends ActivityDefinition<string, BaseParams>> = {
  config: StackflowConfig<T>;
  components: {
    [activityName in T["name"]]: ActivityComponentType<any>;
  };
  plugins?: Array<StackflowPluginsEntry>;
  useHistorySync?: Omit<
    HistorySyncPluginOptions<
      { [key in T["name"]]: unknown },
      Extract<T["name"], string>
    >,
    "routes"
  >;
};

export type StackOutput<T extends ActivityDefinition<string, BaseParams>> = {
  Stack: StackComponentType;
  actions: Actions<T>;
};

export function stack<T extends ActivityDefinition<string, BaseParams>>(
  input: StackInput<T>,
): StackOutput<T> {
  const defaultPlugins = [
    input.useHistorySync
      ? historySyncPlugin({
          ...input.useHistorySync,
          routes: input.config.activities.reduce(
            (acc, a) => ({
              ...acc,
              [a.name]: a.path,
            }),
            {},
          ),
        })
      : null,

    /**
     * `loaderPlugin()` must be placed after `historySyncPlugin()`
     */
    loaderPlugin(input.config),
  ].filter((e) => !!e);

  const plugins = [
    ...defaultPlugins,
    ...(input.plugins ?? [])
      .flat(Number.POSITIVE_INFINITY as 0)
      .map((p) => p as StackflowReactPlugin),
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
        initialContext: props.initialContext,
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

    return (
      <PluginsProvider value={coreStore.pluginInstances}>
        <CoreProvider coreStore={coreStore}>
          <MainRenderer
            activityComponentMap={input.components}
            initialContext={props.initialContext}
          />
        </CoreProvider>
      </PluginsProvider>
    );
  });

  Stack.displayName = "Stack";

  return {
    Stack,
    actions: makeActions(() => getCoreStore()?.actions),
  };
}
