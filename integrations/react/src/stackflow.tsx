import type {
  ActivityRegisteredEvent,
  CoreStore,
  PushedEvent,
  StackflowActions,
  StepPushedEvent,
} from "@stackflow/core";
import { makeCoreStore, makeEvent } from "@stackflow/core";
import { memo, useMemo } from "react";

import type { ActivityComponentType } from "./activity";
import { makeActivityId, makeStepId } from "./activity";
import type { BaseActivities } from "./BaseActivities";
import { CoreProvider } from "./core";
import MainRenderer from "./MainRenderer";
import { PluginsProvider } from "./plugins";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import type { UseActionsOutputType } from "./useActions";
import { useActions } from "./useActions";
import type {
  UseStepActions,
  UseStepActionsOutputType,
} from "./useStepActions";
import { useStepActions } from "./useStepActions";
import { isBrowser, makeRef } from "./utils";

function parseActionOptions(options?: { animate?: boolean }) {
  if (!options) {
    return { skipActiveState: false };
  }

  const isNullableAnimateOption =
    options.animate === undefined || options.animate == null;
  if (isNullableAnimateOption) {
    return { skipActiveState: false };
  }

  return { skipActiveState: !options.animate };
}

export type StackComponentType = React.FC<{
  initialContext?: any;
}>;

type StackflowPluginsEntry<T extends BaseActivities> =
  | StackflowReactPlugin<T>
  | StackflowPluginsEntry<T>[];

export type StackflowOptions<T extends BaseActivities> = {
  /**
   * Register activities used in your app
   */
  activities: T;

  /**
   * Transition duration for stack animation (millisecond)
   */
  transitionDuration: number;

  /**
   * Set the first activity to load at the bottom
   * (It can be overwritten by plugin)
   */
  initialActivity?: () => Extract<keyof T, string>;

  /**
   * Inject stackflow plugins
   */
  plugins?: Array<StackflowPluginsEntry<T>>;
};

export type StackflowOutput<T extends BaseActivities> = {
  /**
   * Return activities
   */
  activities: T;

  /**
   * Created `<Stack />` component
   */
  Stack: StackComponentType;

  /**
   * Created `useFlow()` hooks
   */
  useFlow: () => UseActionsOutputType<T>;

  /**
   * Created `useStepFlow()` hooks
   */
  useStepFlow: UseStepActions<T>;

  /**
   * Add activity imperatively
   */
  addActivity: (options: {
    name: string;
    component: ActivityComponentType<any>;
    paramsSchema?: ActivityRegisteredEvent["activityParamsSchema"];
  }) => void;

  /**
   * Add plugin imperatively
   */
  addPlugin: (plugin: StackflowPluginsEntry<T>) => void;

  /**
   * Created action triggers
   */
  actions: Pick<StackflowActions, "dispatchEvent" | "getStack"> &
    Pick<UseActionsOutputType<T>, "push" | "pop" | "replace"> &
    Pick<UseStepActionsOutputType<{}>, "stepPush" | "stepReplace" | "stepPop">;
};

/**
 * Make `<Stack />` component and `useFlow()` hooks that strictly typed with `activities`
 */
export function stackflow<T extends BaseActivities>(
  options: StackflowOptions<T>,
): StackflowOutput<T> {
  const plugins = (options.plugins ?? [])
    .flat(Infinity as 0)
    .map((p) => p as StackflowReactPlugin<T>);
  const pluginInstances = plugins.map((plugin) => plugin());

  const activityComponentMap = Object.entries(options.activities).reduce(
    (acc, [key, Activity]) => ({
      ...acc,
      [key]:
        "component" in Activity ? memo(Activity.component) : memo(Activity),
    }),
    {} as {
      [key: string]: ActivityComponentType;
    },
  );

  const enoughPastTime = () =>
    new Date().getTime() - options.transitionDuration * 2;

  const staticCoreStore = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: options.transitionDuration,
        eventDate: enoughPastTime(),
      }),
      ...Object.entries(options.activities).map(([activityName, Activity]) =>
        makeEvent("ActivityRegistered", {
          activityName,
          eventDate: enoughPastTime(),
          ...("component" in Activity
            ? {
                activityParamsSchema: Activity.paramsSchema,
              }
            : null),
        }),
      ),
    ],
    plugins: [],
  });

  const [getCoreStore, setCoreStore] = makeRef<CoreStore>();

  const Stack: StackComponentType = memo((props) => {
    const coreStore = useMemo(() => {
      const prevCoreStore = getCoreStore();

      // In a browser environment,
      // memoize `coreStore` so that only one `coreStore` exists throughout the entire app.
      if (isBrowser() && prevCoreStore) {
        return prevCoreStore;
      }

      const initialPushedEventsByOption = options.initialActivity
        ? [
            makeEvent("Pushed", {
              activityId: makeActivityId(),
              activityName: options.initialActivity(),
              activityParams: {},
              eventDate: enoughPastTime(),
              skipEnterActiveState: false,
            }),
          ]
        : [];

      const initialPushedEvents = pluginInstances.reduce<
        (PushedEvent | StepPushedEvent)[]
      >(
        (initialEvents, pluginInstance) =>
          pluginInstance.overrideInitialEvents?.({
            initialEvents,
            initialContext: props.initialContext ?? {},
          }) ?? initialEvents,
        initialPushedEventsByOption,
      );

      const isInitialActivityIgnored =
        initialPushedEvents.length > 0 &&
        initialPushedEventsByOption.length > 0 &&
        initialPushedEvents !== initialPushedEventsByOption;

      if (isInitialActivityIgnored) {
        // eslint-disable-next-line no-console
        console.warn(
          `Stackflow -` +
            ` Some plugin overrides an "initialActivity" option.` +
            ` The "initialActivity" option you set to "${initialPushedEventsByOption[0].activityName}" in the "stackflow" is ignored.`,
        );
      }

      if (initialPushedEvents.length === 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `Stackflow -` +
            ` There is no initial activity.` +
            " If you want to set the initial activity," +
            " add the `initialActivity` option of the `stackflow()` function or" +
            " add a plugin that sets the initial activity. (e.g. `@stackflow/plugin-history-sync`)",
        );
      }

      const store = makeCoreStore({
        initialEvents: [
          ...staticCoreStore.pullEvents(),
          ...initialPushedEvents,
        ],
        plugins,
      });

      if (isBrowser()) {
        store.init();
        setCoreStore(store);
      }

      return store;
    }, []);

    return (
      <PluginsProvider value={pluginInstances}>
        <CoreProvider coreStore={coreStore}>
          <MainRenderer activityComponentMap={activityComponentMap} />
        </CoreProvider>
      </PluginsProvider>
    );
  });

  Stack.displayName = "Stack";

  return {
    activities: options.activities,
    Stack,
    useFlow: useActions,
    useStepFlow: useStepActions,
    addActivity(activity) {
      if (getCoreStore()) {
        // eslint-disable-next-line no-console
        console.warn(
          `Stackflow -` +
            " `addActivity()` API cannot be called after a `<Stack />` component has been rendered",
        );

        return;
      }

      activityComponentMap[activity.name] = memo(activity.component);

      staticCoreStore.actions.dispatchEvent("ActivityRegistered", {
        activityName: activity.name,
        activityParamsSchema: activity.paramsSchema,
        eventDate: enoughPastTime(),
      });
    },
    addPlugin(plugin) {
      if (getCoreStore()) {
        // eslint-disable-next-line no-console
        console.warn(
          `Stackflow -` +
            " `addPlugin()` API cannot be called after a `<Stack />` component has been rendered",
        );

        return;
      }

      [plugin]
        .flat(Infinity as 0)
        .map((p) => p as StackflowReactPlugin<T>)
        .forEach((p) => {
          plugins.push(p);
          pluginInstances.push(p());
        });
    },
    actions: {
      getStack() {
        return (
          getCoreStore()?.actions.getStack() ??
          staticCoreStore.actions.getStack()
        );
      },
      dispatchEvent(name, parameters) {
        return getCoreStore()?.actions.dispatchEvent(name, parameters);
      },
      push(activityName, activityParams, options) {
        const activityId = makeActivityId();

        getCoreStore()?.actions.push({
          activityId,
          activityName,
          activityParams,
          skipEnterActiveState: parseActionOptions(options).skipActiveState,
        });

        return {
          activityId,
        };
      },
      replace(activityName, activityParams, options) {
        const activityId = options?.activityId ?? makeActivityId();

        getCoreStore()?.actions.replace({
          activityId: options?.activityId ?? makeActivityId(),
          activityName,
          activityParams,
          skipEnterActiveState: parseActionOptions(options).skipActiveState,
        });

        return {
          activityId,
        };
      },
      pop(
        count?: number | { animate?: boolean } | undefined,
        options?: { animate?: boolean } | undefined,
      ) {
        let _count = 1;
        let _options: { animate?: boolean } = {};

        if (typeof count === "object") {
          _options = {
            ...count,
          };
        }
        if (typeof count === "number") {
          _count = count;
        }
        if (options) {
          _options = {
            ...options,
          };
        }

        for (let i = 0; i < _count; i += 1) {
          getCoreStore()?.actions.pop({
            skipExitActiveState:
              i === 0 ? parseActionOptions(_options).skipActiveState : true,
          });
        }
      },
      stepPush(params) {
        const stepId = makeStepId();

        return getCoreStore()?.actions.stepPush({
          stepId,
          stepParams: params,
        });
      },
      stepReplace(params) {
        const stepId = makeStepId();

        return getCoreStore()?.actions.stepReplace({
          stepId,
          stepParams: params,
        });
      },
      stepPop() {
        return getCoreStore()?.actions.stepPop({});
      },
    },
  };
}
