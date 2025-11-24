import {
  type CoreStore,
  makeCoreStore,
  makeEvent,
  type PushedEvent,
} from "@stackflow/core";
import React, { useMemo } from "react";
import isEqual from "react-fast-compare";
import { ActivityComponentMapProvider } from "../__internal__/ActivityComponentMapProvider";
import { makeActivityId } from "../__internal__/activity";
import { CoreProvider } from "../__internal__/core";
import MainRenderer from "../__internal__/MainRenderer";
import { PluginsProvider } from "../__internal__/plugins";
import { isBrowser, makeRef } from "../__internal__/utils";
import type { StackflowReactPlugin } from "../stable";
import { ConfigProvider } from "./ConfigProvider";
import {
  type ActivityDefinitionOutput,
  type DestinationsMap,
  isNavigationDefinition,
  type NavigationDefinitionOutput,
} from "./defineActivity";
import { DataLoaderProvider, loaderPlugin } from "./loader";
import type { StackComponentType } from "./StackComponentType";

const DEFAULT_LOADER_CACHE_MAX_AGE = 1000 * 30;

export type ActivitiesMap = DestinationsMap;

type AllActivityNames<T extends DestinationsMap> = T extends DestinationsMap
  ? {
      [K in keyof T]: T[K] extends NavigationDefinitionOutput<string, infer U>
        ? AllActivityNames<U>
        : K;
    }[keyof T]
  : never;

type GetActivityDefinition<
  T extends DestinationsMap,
  K extends string,
> = K extends keyof T
  ? T[K] extends ActivityDefinitionOutput<string, any>
    ? T[K]
    : never
  : {
      [N in keyof T]: T[N] extends NavigationDefinitionOutput<string, infer U>
        ? GetActivityDefinition<U, K>
        : never;
    }[keyof T];

export type InferActivityParamsFromMap<
  TActivities extends DestinationsMap,
  TName extends string,
> = GetActivityDefinition<TActivities, TName> extends ActivityDefinitionOutput<
  string,
  infer P
>
  ? P
  : never;

export type TypedActions<TActivities extends ActivitiesMap> = {
  push<K extends Extract<AllActivityNames<TActivities>, string>>(
    activityName: K,
    activityParams: InferActivityParamsFromMap<TActivities, K>,
    options?: { animate?: boolean },
  ): { activityId: string };

  replace<K extends Extract<AllActivityNames<TActivities>, string>>(
    activityName: K,
    activityParams: InferActivityParamsFromMap<TActivities, K>,
    options?: { animate?: boolean; activityId?: string },
  ): { activityId: string };

  pop(): void;
  pop(options: { animate?: boolean }): void;
  pop(count: number, options?: { animate?: boolean }): void;

  canGoBack: boolean;
};

export type TypedStepActions<TParams extends Record<string, unknown>> = {
  stepPush(params: TParams): void;
  stepReplace(params: TParams): void;
  stepPop(): void;
};

export interface StructuredStackflowInput<TActivities extends ActivitiesMap> {
  activities: TActivities;
  transitionDuration?: number;
  initialActivity: Extract<AllActivityNames<TActivities>, string>;
  plugins?: Array<StackflowReactPlugin | StackflowReactPlugin[]>;
}

function flattenActivities(
  activities: DestinationsMap,
  result: Array<{
    name: string;
    route?: any;
    loader?: any;
    component: any;
  }> = [],
  visitedNames: Set<string> = new Set(),
): Array<{ name: string; route?: any; loader?: any; component: any }> {
  for (const [, def] of Object.entries(activities)) {
    if (isNavigationDefinition(def)) {
      flattenActivities(def.activities, result, visitedNames);
    } else {
      if (visitedNames.has(def.name)) {
        throw new Error(
          `Duplicate activity name detected: "${def.name}". Activity names must be unique across the entire application.`,
        );
      }
      visitedNames.add(def.name);
      result.push({
        ...def,
        name: def.name,
        route: def.route,
        loader: def.loader,
        component: def.component,
      });
    }
  }

  return result;
}

export function createRoutesFromActivities(
  activities: DestinationsMap,
  routes: Record<string, any> = {},
): Record<string, any> {
  for (const [, def] of Object.entries(activities)) {
    if (isNavigationDefinition(def)) {
      createRoutesFromActivities(def.activities, routes);
    } else {
      if (def.route) {
        routes[def.name] = def.route;
      }
    }
  }
  return routes;
}

export interface StructuredStackflowOutput<TActivities extends ActivitiesMap> {
  Stack: StackComponentType;
  actions: TypedActions<TActivities>;
  stepActions: TypedStepActions<Record<string, unknown>>;
  useFlow: () => TypedActions<TActivities>;
  useStepFlow: () => TypedStepActions<Record<string, unknown>>;
}

export function structuredStackflow<TActivities extends ActivitiesMap>(
  input: StructuredStackflowInput<TActivities>,
): StructuredStackflowOutput<TActivities> {
  const transitionDuration = input.transitionDuration ?? 270;

  const flattenedActivities = flattenActivities(input.activities);

  const activitiesConfig = flattenedActivities.map(
    ({ component, ...activity }) => ({
      ...activity,
      name: activity.name,
      route: activity.route,
      loader: activity.loader,
    }),
  );

  const componentsMap = Object.fromEntries(
    flattenedActivities.map((activity) => [activity.name, activity.component]),
  );

  const loaderDataCacheMap = new Map<
    string,
    { params: Record<string, unknown>; data: unknown }[]
  >();

  const loadData = (
    activityName: string,
    activityParams: Record<string, unknown>,
  ) => {
    const cache = loaderDataCacheMap.get(activityName);
    const cacheEntry = cache?.find((entry) =>
      isEqual(entry.params, activityParams),
    );

    if (cacheEntry) {
      return cacheEntry.data;
    }

    const activityConfig = activitiesConfig.find(
      (activity) => activity.name === activityName,
    );

    if (!activityConfig) {
      throw new Error(`Activity ${activityName} is not registered.`);
    }

    const loaderData = activityConfig.loader?.({
      params: activityParams,
      config: {
        activities: activitiesConfig,
        transitionDuration,
      },
    });

    const newCacheEntry = {
      params: activityParams,
      data: loaderData,
    };

    if (cache) {
      cache.push(newCacheEntry);
    } else {
      loaderDataCacheMap.set(activityName, [newCacheEntry]);
    }

    const clearCache = () => {
      const cache = loaderDataCacheMap.get(activityName);
      if (!cache) return;
      loaderDataCacheMap.set(
        activityName,
        cache.filter((entry) => entry !== newCacheEntry),
      );
    };

    const clearCacheAfterMaxAge = () => {
      setTimeout(
        clearCache,
        (activityConfig.loader as any)?.loaderCacheMaxAge ??
          DEFAULT_LOADER_CACHE_MAX_AGE,
      );
    };

    Promise.resolve(loaderData).then(clearCacheAfterMaxAge, (error) => {
      clearCache();
      throw error;
    });

    return loaderData;
  };

  const internalConfig = {
    activities: activitiesConfig,
    transitionDuration,
    initialActivity: () => input.initialActivity,
    decorate: () => {},
  };

  const plugins = [
    ...(input.plugins ?? [])
      .flat(Number.POSITIVE_INFINITY as 0)
      .map((p) => p as StackflowReactPlugin),
    loaderPlugin(
      {
        config: internalConfig as any,
        components: componentsMap as any,
      },
      loadData,
    ),
  ];

  const enoughPastTime = () => Date.now() - transitionDuration * 2;

  const staticCoreStore = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration,
        eventDate: enoughPastTime(),
      }),
      ...activitiesConfig.map((activity) =>
        makeEvent("ActivityRegistered", {
          activityName: activity.name,
          eventDate: enoughPastTime(),
        }),
      ),
    ],
    plugins: [],
  });

  const [getCoreStore, setCoreStore] = makeRef<CoreStore>();

  const createActions = (
    getStore: () => CoreStore | undefined,
  ): TypedActions<TActivities> => ({
    push(activityName, activityParams, options) {
      const activityId = makeActivityId();
      getStore()?.actions.push({
        activityId,
        activityName: activityName as string,
        activityParams: activityParams as any,
        skipEnterActiveState: options?.animate === false,
      });
      return { activityId };
    },
    replace(activityName, activityParams, options) {
      const activityId = options?.activityId ?? makeActivityId();
      getStore()?.actions.replace({
        activityId,
        activityName: activityName as string,
        activityParams: activityParams as any,
        skipEnterActiveState: options?.animate === false,
      });
      return { activityId };
    },
    pop(
      countOrOptions?: number | { animate?: boolean },
      options?: { animate?: boolean },
    ) {
      let count = 1;
      let opts: { animate?: boolean } = {};

      if (typeof countOrOptions === "object") {
        opts = countOrOptions;
      } else if (typeof countOrOptions === "number") {
        count = countOrOptions;
        opts = options ?? {};
      }

      for (let i = 0; i < count; i++) {
        getStore()?.actions.pop({
          skipExitActiveState: i === 0 ? opts.animate === false : true,
        });
      }
    },
    get canGoBack() {
      const stack = getStore()?.actions.getStack();
      if (!stack) return false;
      const activeActivities = stack.activities.filter(
        (a) =>
          a.transitionState === "enter-done" ||
          a.transitionState === "enter-active",
      );
      return activeActivities.length > 1;
    },
  });

  const createStepActions = (
    getStore: () => CoreStore | undefined,
  ): TypedStepActions<Record<string, unknown>> => ({
    stepPush(params) {
      getStore()?.actions.stepPush({
        stepId: makeActivityId(),
        stepParams: params as any,
      });
    },
    stepReplace(params) {
      getStore()?.actions.stepReplace({
        stepId: makeActivityId(),
        stepParams: params as any,
      });
    },
    stepPop() {
      getStore()?.actions.stepPop({});
    },
  });

  const Stack: StackComponentType = React.memo((props) => {
    const initialContext = useMemo(
      () => ({
        ...props.initialContext,
        ...(props.initialLoaderData
          ? { initialLoaderData: props.initialLoaderData }
          : null),
      }),
      [],
    );

    const coreStore = useMemo(() => {
      const prevCoreStore = getCoreStore();

      if (isBrowser() && prevCoreStore) {
        return prevCoreStore;
      }

      const initialPushedEventsByOption = [
        makeEvent("Pushed", {
          activityId: makeActivityId(),
          activityName: input.initialActivity,
          activityParams: {},
          eventDate: enoughPastTime(),
          skipEnterActiveState: false,
        }),
      ];

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
                }" is ignored.`,
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
      <ConfigProvider value={internalConfig as any}>
        <PluginsProvider value={coreStore.pluginInstances}>
          <CoreProvider coreStore={coreStore}>
            <ActivityComponentMapProvider value={componentsMap as any}>
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
    actions: createActions(() => getCoreStore() ?? undefined),
    stepActions: createStepActions(() => getCoreStore() ?? undefined),
    useFlow: () => createActions(() => getCoreStore() ?? undefined),
    useStepFlow: () => createStepActions(() => getCoreStore() ?? undefined),
  };
}
