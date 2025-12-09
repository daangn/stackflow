import type {
  ActivityBaseParams,
  ActivityDefinition,
  Config,
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import {
  type CoreStore,
  makeCoreStore,
  makeEvent,
  type PushedEvent,
} from "@stackflow/core";
import {
  liftValue,
  makeSyncInspectable,
  type SyncInspectablePromise,
} from "__internal__/utils/SyncInspectablePromise";
import React, { useMemo } from "react";
import isEqual from "react-fast-compare";
import { ActivityComponentMapProvider } from "../__internal__/ActivityComponentMapProvider";
import type { ActivityComponentType } from "../__internal__/ActivityComponentType";
import { makeActivityId } from "../__internal__/activity";
import { CoreProvider } from "../__internal__/core";
import MainRenderer from "../__internal__/MainRenderer";
import { PluginsProvider } from "../__internal__/plugins";
import { isBrowser, makeRef } from "../__internal__/utils";
import type { StackflowReactPlugin } from "../stable";
import type { Actions } from "./Actions";
import { ConfigProvider } from "./ConfigProvider";
import { DataLoaderProvider, loaderPlugin } from "./loader";
import { makeActions } from "./makeActions";
import { makeStepActions } from "./makeStepActions";
import type { StackComponentType } from "./StackComponentType";
import type { StepActions } from "./StepActions";

export type StackflowPluginsEntry =
  | StackflowReactPlugin<never>
  | StackflowPluginsEntry[];

export type StackflowInput<
  T extends ActivityDefinition<RegisteredActivityName>,
  R extends {
    [activityName in RegisteredActivityName]: ActivityComponentType<any>;
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
  T extends ActivityDefinition<RegisteredActivityName>,
  R extends {
    [activityName in RegisteredActivityName]: ActivityComponentType<
      InferActivityParams<activityName>
    >;
  },
>(input: StackflowInput<T, R>): StackflowOutput {
  const loadData = (activityName: string, activityParams: {}) => {
    const activityConfig = input.config.activities.find(
      (activity) => activity.name === activityName,
    );

    if (!activityConfig) {
      throw new Error(`Activity ${activityName} is not registered.`);
    }

    const loaderData = activityConfig.loader?.({
      params: activityParams,
      config: input.config,
    });

    return loaderData;
  };
  const plugins = [
    ...(input.plugins ?? [])
      .flat(Number.POSITIVE_INFINITY as 0)
      .map((p) => p as StackflowReactPlugin),

    /**
     * `loaderPlugin()` must be placed after `historySyncPlugin()`
     */
    loaderPlugin(input, loadData),
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
            if (isBrowser()) {
              console.warn(
                `Stackflow - Some plugin overrides an "initialActivity" option. The "initialActivity" option you set to "${
                  (initialPushedEvents[0] as PushedEvent).activityName
                }" in the "stackflow" is ignored.`,
              );
            }
          },
          onInitialActivityNotFound: () => {
            if (isBrowser()) {
              console.warn(
                "Stackflow -" +
                  " There is no initial activity." +
                  " If you want to set the initial activity," +
                  " add the `initialActivity` option of the `stackflow()` function or" +
                  " add a plugin that sets the initial activity. (e.g. `@stackflow/plugin-history-sync`)",
              );
            }
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
      <ConfigProvider value={input.config}>
        <PluginsProvider value={coreStore.pluginInstances}>
          <CoreProvider coreStore={coreStore}>
            <ActivityComponentMapProvider value={input.components}>
              <DataLoaderProvider loadData={loadData}>
                <MainRenderer initialContext={initialContext} />
              </DataLoaderProvider>
            </ActivityComponentMapProvider>
          </CoreProvider>
        </PluginsProvider>
      </ConfigProvider>
    );
  });

  Stack.displayName = "Stack";

  return {
    Stack,
    actions: makeActions(() => getCoreStore()?.actions),
    stepActions: makeStepActions(() => getCoreStore()?.actions),
  };
}
