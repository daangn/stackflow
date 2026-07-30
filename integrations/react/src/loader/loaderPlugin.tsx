import type {
  ActivityDefinition,
  RegisteredActivityName,
} from "@stackflow/config";
import { id, type Stack } from "@stackflow/core";
import type { ActivityComponentType } from "../BaseActivityComponentType";
import type { StackflowReactPlugin } from "../StackflowReactPlugin";
import {
  getContentComponent,
  isStructuredActivityComponent,
} from "../StructuredActivityComponentType";
import type { StackflowInput } from "../stackflow";
import { LoaderResultProvider } from "./LoaderResultContext";
import {
  defer,
  inspect,
  PromiseStatus,
  resolve,
  type SyncInspectablePromise,
} from "../utils/SyncInspectablePromise";

const LOADER_RESULT_ID_KEY = "@stackflow/react/loaderResultId";

type LoaderResultId = string;

type LoaderResultEntry = {
  promise: SyncInspectablePromise<unknown>;
  start?: (load: () => unknown) => boolean;
};

function getLoaderResultId(
  activityContext: unknown,
): LoaderResultId | undefined {
  if (typeof activityContext !== "object" || activityContext === null) {
    return undefined;
  }

  const loaderResultId = (activityContext as Record<string, unknown>)[
    LOADER_RESULT_ID_KEY
  ];

  return typeof loaderResultId === "string" ? loaderResultId : undefined;
}

function withLoaderResultId(
  activityContext: unknown,
  loaderResultId: LoaderResultId,
) {
  return {
    ...(typeof activityContext === "object" && activityContext !== null
      ? activityContext
      : {}),
    [LOADER_RESULT_ID_KEY]: loaderResultId,
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
    const loaderResults = new Map<LoaderResultId, LoaderResultEntry>();

    const addLoaderResult = (promise: SyncInspectablePromise<unknown>) => {
      const loaderResultId = id();
      loaderResults.set(loaderResultId, { promise });
      return loaderResultId;
    };

    const addDeferredLoaderResult = () => {
      const loaderData = defer<unknown>();
      let started = false;
      const loaderResultId = id();

      loaderResults.set(loaderResultId, {
        promise: loaderData.promise,
        start(load) {
          if (started) {
            return false;
          }

          started = true;

          try {
            loaderData.resolve(load());
          } catch (error) {
            loaderData.reject(error);
          }

          return true;
        },
      });

      return loaderResultId;
    };

    const resolveDeferredLoaderData = ({
      activityName,
      activityParams,
      loaderResultId,
    }: {
      activityName: string;
      activityParams: {};
      loaderResultId: LoaderResultId | undefined;
    }) => {
      const matchActivity = input.config.activities.find(
        (candidate) => candidate.name === activityName,
      );
      const loaderResult = loaderResultId
        ? loaderResults.get(loaderResultId)
        : undefined;

      if (!matchActivity?.loader || !loaderResult?.start) {
        return;
      }

      if (!loaderResult.start(() => loadData(activityName, activityParams))) {
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

    const resolveRestoredStackLoaderData = (stack: Stack) => {
      stack.activities
        .filter((activity) => activity.transitionState !== "exit-done")
        .forEach((activity) => {
          resolveDeferredLoaderData({
            activityName: activity.name,
            activityParams: activity.params,
            loaderResultId: getLoaderResultId(activity.context),
          });
        });
    };

    const resolvePausedEventLoaderData = (
      pausedEvents: Stack["pausedEvents"],
    ) => {
      pausedEvents?.forEach((event) => {
        if (event.name !== "Pushed" && event.name !== "Replaced") {
          return;
        }

        resolveDeferredLoaderData({
          activityName: event.activityName,
          activityParams: event.activityParams,
          loaderResultId: getLoaderResultId(event.activityContext),
        });
      });
    };

    return {
      key: "plugin-loader",
      overrideInitialEvents({ initialEvents, initialContext, initInfo }) {
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

            const loaderResultId = addDeferredLoaderResult();

            return {
              ...event,
              activityContext: withLoaderResultId(
                event.activityContext,
                loaderResultId,
              ),
            };
          });
        }

        return initialEvents.map((event) => {
          if (event.name !== "Pushed" && event.name !== "Replaced") {
            return event;
          }

          const { activityName, activityParams } = event;

          const matchActivity = input.config.activities.find(
            (activity) => activity.name === activityName,
          );

          const loader = matchActivity?.loader;

          if (!loader) {
            return event;
          }

          if (initialContext.initialLoaderData) {
            const loaderResultId = addLoaderResult(
              resolve(initialContext.initialLoaderData),
            );

            return {
              ...event,
              activityContext: withLoaderResultId(
                event.activityContext,
                loaderResultId,
              ),
            };
          }

          const loaderData = resolve(loadData(activityName, activityParams));
          const loaderResultId = addLoaderResult(loaderData);

          Promise.allSettled([loaderData]).then(([loaderDataPromiseResult]) => {
            printLoaderDataPromiseError({
              promiseResult: loaderDataPromiseResult,
              activityName: matchActivity.name,
            });
          });

          return {
            ...event,
            activityContext: withLoaderResultId(
              event.activityContext,
              loaderResultId,
            ),
          };
        });
      },
      onInit({ actions, initInfo }) {
        if (initInfo?.kind !== "load") {
          return;
        }

        const stack = actions.getStack();
        resolveRestoredStackLoaderData(stack);
        resolvePausedEventLoaderData(stack.pausedEvents);
      },
      onBeforePush: createBeforeRouteHandler(input, loadData, addLoaderResult),
      onBeforeReplace: createBeforeRouteHandler(
        input,
        loadData,
        addLoaderResult,
      ),
      wrapActivity({ activity }) {
        const loaderResultId = getLoaderResultId(activity.context);
        const loaderResultPromise = loaderResultId
          ? loaderResults.get(loaderResultId)?.promise
          : undefined;

        return (
          <LoaderResultProvider loaderResultPromise={loaderResultPromise}>
            {activity.render()}
          </LoaderResultProvider>
        );
      },
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
>(
  input: StackflowInput<T, R>,
  loadData: (activityName: string, activityParams: {}) => unknown,
  addLoaderResult: (promise: SyncInspectablePromise<unknown>) => LoaderResultId,
): OnBeforeRoute {
  return ({ actionParams, actions }) => {
    if (actions.isPrevented()) {
      return;
    }

    const { overrideActionParams, pause, resume } = actions;
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
      pause();

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
          resume();
        });
    }

    if (!loaderData) {
      return;
    }

    const loaderResultId = addLoaderResult(loaderData);

    overrideActionParams({
      ...actionParams,
      activityContext: withLoaderResultId(activityContext, loaderResultId),
    });
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
