import type {
  ActivityDefinition,
  RegisteredActivityName,
} from "@stackflow/config";
import { id as makeLoaderResultId, type Stack } from "@stackflow/core";
import type { ActivityComponentType } from "../BaseActivityComponentType";
import type { StackflowReactPlugin } from "../StackflowReactPlugin";
import {
  getContentComponent,
  isStructuredActivityComponent,
} from "../StructuredActivityComponentType";
import type { StackflowInput } from "../stackflow";
import {
  defer,
  inspect,
  PromiseStatus,
  resolve,
  type SyncInspectablePromise,
} from "../utils/SyncInspectablePromise";
import { LoaderDataProvider } from "./LoaderDataContext";

type LoaderResult = {
  promise: SyncInspectablePromise<unknown>;
  start?: (load: () => unknown) => boolean;
};

function createRestoredLoaderResult(): LoaderResult {
  // Snapshot replay creates placeholders before loaders can run in onInit, and
  // repeated restore scans must not execute the same loader more than once.
  const deferred = defer<unknown>();
  let started = false;

  return {
    promise: deferred.promise,
    start(load) {
      if (started) {
        return false;
      }

      started = true;

      try {
        deferred.resolve(load());
      } catch (error) {
        deferred.reject(error);
      }

      return true;
    },
  };
}

function withoutLegacyLoaderData<T extends { activityContext?: {} }>(
  value: T,
): T {
  const activityContext = {
    ...value.activityContext,
  } as Record<string, unknown>;
  delete activityContext.loaderData;

  return {
    ...value,
    activityContext,
  };
}

function getLoaderResultId(activityContext: unknown) {
  if (!activityContext || typeof activityContext !== "object") {
    return undefined;
  }

  const { loaderResultId } = activityContext as {
    loaderResultId?: unknown;
  };

  return typeof loaderResultId === "string" ? loaderResultId : undefined;
}

function withLoaderResultId<T extends { activityContext?: {} }>(
  value: T,
  loaderResultId: string,
): T {
  return {
    ...value,
    activityContext: {
      ...value.activityContext,
      loaderResultId,
    },
  };
}

export function loaderPlugin<
  T extends ActivityDefinition<RegisteredActivityName>,
  R extends {
    [activityName in RegisteredActivityName]: ActivityComponentType<any>;
  },
>(
  input: StackflowInput<T, R>,
  loadData: (activityName: string, activityParams: {}) => unknown,
): StackflowReactPlugin {
  return () => {
    // React may still render an older activity context after core advances, so
    // result entries remain available for the lifetime of the plugin instance.
    const loaderResults = new Map<string, LoaderResult>();

    const startRestoredLoaderData = ({
      activityContext,
      activityName,
      activityParams,
    }: {
      activityContext: unknown;
      activityName: string;
      activityParams: {};
    }) => {
      const matchActivity = input.config.activities.find(
        (candidate) => candidate.name === activityName,
      );
      const loaderResultId = getLoaderResultId(activityContext);
      const loaderResult = loaderResultId
        ? loaderResults.get(loaderResultId)
        : undefined;

      if (
        !matchActivity?.loader ||
        !loaderResult?.start ||
        !loaderResult.start(() => loadData(activityName, activityParams))
      ) {
        return;
      }

      Promise.allSettled([loaderResult.promise]).then(
        ([loaderDataPromiseResult]) => {
          printLoaderDataPromiseError({
            promiseResult: loaderDataPromiseResult,
            activityName: matchActivity.name,
          });
        },
      );
    };

    const startRestoredStackLoaderData = (stack: Stack) => {
      stack.activities
        .filter((activity) => activity.transitionState !== "exit-done")
        .forEach((activity) => {
          startRestoredLoaderData({
            activityContext: activity.context,
            activityName: activity.name,
            activityParams: activity.params,
          });
        });
    };

    const startPausedEventLoaderData = (
      pausedEvents: Stack["pausedEvents"],
    ) => {
      pausedEvents?.forEach((event) => {
        if (event.name !== "Pushed" && event.name !== "Replaced") {
          return;
        }

        startRestoredLoaderData({
          activityContext: event.activityContext,
          activityName: event.activityName,
          activityParams: event.activityParams,
        });
      });
    };

    return {
      key: "plugin-loader",
      wrapActivity({ activity }) {
        const loaderResultId = getLoaderResultId(activity.context);

        return (
          <LoaderDataProvider
            value={
              loaderResultId
                ? loaderResults.get(loaderResultId)?.promise
                : undefined
            }
          >
            {activity.render()}
          </LoaderDataProvider>
        );
      },
      overrideInitialEvents({ initialEvents, initialContext, initInfo }) {
        loaderResults.clear();

        if (initialEvents.length === 0) {
          return [];
        }

        if (initInfo?.kind === "load") {
          return initialEvents.map((event) => {
            if (event.name !== "Pushed" && event.name !== "Replaced") {
              return event;
            }

            const matchActivity = input.config.activities.find(
              (activity) => activity.name === event.activityName,
            );

            if (!matchActivity?.loader) {
              return event;
            }

            const existingLoaderResultId = getLoaderResultId(
              event.activityContext,
            );
            const loaderResultId =
              existingLoaderResultId ?? makeLoaderResultId();
            loaderResults.set(loaderResultId, createRestoredLoaderResult());

            // ID-less loader events use the legacy schema, where loaderData was
            // owned by this plugin and carried the Promise or loader result.
            return withLoaderResultId(
              existingLoaderResultId ? event : withoutLegacyLoaderData(event),
              loaderResultId,
            );
          });
        }

        return initialEvents.map((event) => {
          if (event.name !== "Pushed" && event.name !== "Replaced") {
            return event;
          }

          if (initialContext.initialLoaderData) {
            const loaderResultId = makeLoaderResultId();
            loaderResults.set(loaderResultId, {
              promise: resolve(initialContext.initialLoaderData),
            });
            return withLoaderResultId(event, loaderResultId);
          }

          const { activityName, activityParams } = event;

          const matchActivity = input.config.activities.find(
            (activity) => activity.name === activityName,
          );

          const loader = matchActivity?.loader;

          if (!loader) {
            return event;
          }

          const loaderData = resolve(loadData(activityName, activityParams));

          Promise.allSettled([loaderData]).then(([loaderDataPromiseResult]) => {
            printLoaderDataPromiseError({
              promiseResult: loaderDataPromiseResult,
              activityName: matchActivity.name,
            });
          });

          const loaderResultId = makeLoaderResultId();
          loaderResults.set(loaderResultId, {
            promise: loaderData,
          });
          return withLoaderResultId(event, loaderResultId);
        });
      },
      onInit({ actions, initInfo }) {
        if (initInfo?.kind === "load") {
          const stack = actions.getStack();

          startRestoredStackLoaderData(stack);
          startPausedEventLoaderData(stack.pausedEvents);
        }
      },
      onBeforePush: createBeforeRouteHandler({
        input,
        loadData,
        loaderResults,
      }),
      onBeforeReplace: createBeforeRouteHandler({
        input,
        loadData,
        loaderResults,
      }),
    };
  };
}

type OnBeforeRoute = NonNullable<
  | ReturnType<StackflowReactPlugin>["onBeforePush"]
  | ReturnType<StackflowReactPlugin>["onBeforeReplace"]
>;

function createBeforeRouteHandler<
  T extends ActivityDefinition<RegisteredActivityName>,
  R extends {
    [activityName in RegisteredActivityName]: ActivityComponentType<any>;
  },
>({
  input,
  loadData,
  loaderResults,
}: {
  input: StackflowInput<T, R>;
  loadData: (activityName: string, activityParams: {}) => unknown;
  loaderResults: Map<string, LoaderResult>;
}): OnBeforeRoute {
  return ({ actionParams, actions }) => {
    if (actions.isPrevented()) {
      return;
    }

    const { activityName, activityParams, activityContext } = actionParams;

    const matchActivity = input.config.activities.find(
      (activity) => activity.name === activityName,
    );
    const matchActivityComponent = input.components[activityName as T["name"]];

    if (!matchActivity || !matchActivityComponent) {
      return;
    }

    const loaderData =
      matchActivity.loader && resolve(loadData(activityName, activityParams));
    const lazyComponentPromise = resolve(
      isStructuredActivityComponent(matchActivityComponent) &&
        typeof matchActivityComponent.content === "function"
        ? getContentComponent(matchActivityComponent).preload()
        : "_load" in matchActivityComponent &&
            typeof matchActivityComponent._load === "function"
          ? matchActivityComponent._load()
          : undefined,
    );
    const shouldRenderImmediately = (activityContext as any)
      ?.lazyActivityComponentRenderContext?.shouldRenderImmediately;

    if (
      ((loaderData && inspect(loaderData).status === PromiseStatus.PENDING) ||
        inspect(lazyComponentPromise).status === PromiseStatus.PENDING) &&
      (shouldRenderImmediately !== true ||
        "loading" in matchActivityComponent === false)
    ) {
      actions.pause();

      Promise.allSettled([loaderData, lazyComponentPromise])
        .then(([loaderDataPromiseResult, lazyComponentPromiseResult]) => {
          printLoaderDataPromiseError({
            promiseResult: loaderDataPromiseResult,
            activityName: matchActivity.name,
          });
          printLazyComponentPromiseError({
            promiseResult: lazyComponentPromiseResult,
            activityName: matchActivity.name,
          });
        })
        .finally(() => {
          actions.resume();
        });
    }

    if (loaderData) {
      const loaderResultId = makeLoaderResultId();
      loaderResults.set(loaderResultId, {
        promise: loaderData,
      });
      actions.overrideActionParams(
        withLoaderResultId(actionParams, loaderResultId),
      );
    }
  };
}

function printLoaderDataPromiseError({
  promiseResult,
  activityName,
}: {
  promiseResult: PromiseSettledResult<any>;
  activityName: string;
}) {
  if (promiseResult.status === "rejected") {
    console.error(promiseResult.reason);
    console.error(
      `The above error occurred in the "${activityName}" activity loader`,
    );
  }
}

function printLazyComponentPromiseError({
  promiseResult,
  activityName,
}: {
  promiseResult: PromiseSettledResult<any>;
  activityName: string;
}) {
  if (promiseResult.status === "rejected") {
    console.error(promiseResult.reason);
    console.error(
      `The above error occurred while loading a lazy react component of the "${activityName}" activity`,
    );
  }
}
