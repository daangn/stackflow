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
import MainRenderer from "../__internal__/MainRenderer";
import { makeActivityId } from "../__internal__/activity";
import { CoreProvider } from "../__internal__/core";
import { PluginsProvider } from "../__internal__/plugins";
import { isBrowser } from "../__internal__/utils";
import type { ActivityComponentType, StackflowSolidPlugin } from "../stable";
import type { Actions } from "./Actions";
import type { StackComponentType } from "./StackComponentType";
import type { StepActions } from "./StepActions";
import { loaderPlugin } from "./loader";
import { makeActions } from "./makeActions";
import { makeStepActions } from "./makeStepActions";

export type StackflowPluginsEntry =
  | StackflowSolidPlugin<never>
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
      .map((p) => p as StackflowSolidPlugin),

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

  let currentCoreStore: CoreStore | undefined;

  const Stack: StackComponentType = (props) => {
    let coreStore: CoreStore;

    /**
     * In a browser environment,
     * memoize `coreStore` so that only one `coreStore` exists throughout the entire app.
     */
    if (isBrowser() && currentCoreStore) {
      coreStore = currentCoreStore;
    } else {
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

      coreStore = makeCoreStore({
        initialEvents: [
          ...staticCoreStore.pullEvents(),
          ...initialPushedEventsByOption,
        ],
        initialContext: {
          initialLoaderData: props.initialLoaderData,
        },
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
        coreStore.init();
        currentCoreStore = coreStore;
      }
    }

    return (
      <PluginsProvider value={coreStore.pluginInstances}>
        <CoreProvider coreStore={coreStore}>
          <MainRenderer
            activityComponentMap={input.components}
            initialContext={{
              initialLoaderData: props.initialLoaderData,
            }}
          />
        </CoreProvider>
      </PluginsProvider>
    );
  };

  return {
    Stack,
    actions: makeActions(() => currentCoreStore?.actions),
    stepActions: makeStepActions(() => currentCoreStore?.actions),
  };
}
