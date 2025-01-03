import type {
  ActivityRegisteredEvent,
  CoreStore,
  PushedEvent,
  StackflowActions,
  StepPushedEvent,
} from "@stackflow/core";
import { makeCoreStore, makeEvent } from "@stackflow/core";
import { memo, useMemo } from "react";

import type { ActivityComponentType } from "../__internal__/ActivityComponentType";
import MainRenderer from "../__internal__/MainRenderer";
import type { StackflowReactPlugin } from "../__internal__/StackflowReactPlugin";
import { makeActivityId, makeStepId } from "../__internal__/activity";
import { CoreProvider } from "../__internal__/core";
import { PluginsProvider } from "../__internal__/plugins";
import { useDeferredValue, useSyncExternalStore } from "../__internal__/shims";
import { isBrowser, makeRef } from "../__internal__/utils";
import type { BaseActivities } from "./BaseActivities";
import type { UseActionsOutputType } from "./useActions";
import { useActions } from "./useActions";
import type {
  UseStepActions,
  UseStepActionsOutputType,
} from "./useStepActions";
import { useStepActions } from "./useStepActions";

function parseActionOptions(options?: { animate?: boolean }) {
  if (!options) {
    return { skipActiveState: false };
  }

  const isNullableAnimateOption = options.animate == null;

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

type NoInfer<T> = [T][T extends any ? 0 : never];

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
  initialActivity?: () => Extract<keyof NoInfer<T>, string>;

  /**
   * Inject stackflow plugins
   */
  plugins?: Array<StackflowPluginsEntry<NoInfer<T>>>;

  /**
   * Render stack state with `useDeferredValue()` (concurrent rendering)
   * https://react.dev/reference/react/useDeferredValue
   */
  useDeferredStack?: boolean;
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
    .flat(Number.POSITIVE_INFINITY as 0)
    .map((p) => p as StackflowReactPlugin);

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

  const useDeferredStack = options.useDeferredStack ?? true;

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

    const coreState = useSyncExternalStore(
      coreStore.subscribe,
      coreStore.actions.getStack,
      coreStore.actions.getStack,
    );

    const deferredCoreState = useDeferredValue(coreState);

    return (
      <PluginsProvider value={coreStore.pluginInstances}>
        <CoreProvider
          coreStore={coreStore}
          coreState={useDeferredStack ? deferredCoreState : coreState}
        >
          <MainRenderer
            activityComponentMap={activityComponentMap}
            initialContext={props.initialContext}
          />
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
        console.warn(
          "Stackflow -" +
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
        console.warn(
          "Stackflow -" +
            " `addPlugin()` API cannot be called after a `<Stack />` component has been rendered",
        );

        return;
      }

      [plugin]
        .flat(Number.POSITIVE_INFINITY as 0)
        .map((p) => p as StackflowReactPlugin)
        .forEach((p) => {
          plugins.push(p);
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
