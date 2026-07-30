import type {
  ActivityDefinition,
  RegisteredActivityName,
} from "@stackflow/config";
import type { Stack } from "@stackflow/core";
import type { ActivityComponentType } from "../BaseActivityComponentType";
import type { StackflowReactPlugin } from "../StackflowReactPlugin";
import {
  getContentComponent,
  isStructuredActivityComponent,
} from "../StructuredActivityComponentType";
import type { StackflowInput } from "../stackflow";
import { LoaderResultContext } from "./LoaderResultContext";
import { LoaderResultStore, type LoaderResultId } from "./LoaderResultStore";
import {
  inspect,
  PromiseStatus,
  resolve,
} from "../utils/SyncInspectablePromise";

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
    const loaderResultStore = new LoaderResultStore();

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
      if (!matchActivity?.loader || !loaderResultId) {
        return;
      }

      const loaderData = loaderResultStore.start(loaderResultId, () =>
        loadData(activityName, activityParams),
      );

      if (!loaderData) {
        return;
      }

      Promise.allSettled([loaderData]).then(([loaderDataPromiseResult]) => {
        printLoaderDataPromiseError({
          promiseResult: loaderDataPromiseResult,
          activityName: matchActivity.name,
        });
      });
    };

    const resolveRestoredStackLoaderData = (stack: Stack) => {
      stack.activities
        .filter((activity) => activity.transitionState !== "exit-done")
        .forEach((activity) => {
          resolveDeferredLoaderData({
            activityName: activity.name,
            activityParams: activity.params,
            loaderResultId: loaderResultStore.getId(activity.context),
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
          loaderResultId: loaderResultStore.getId(event.activityContext),
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

            const loaderResultId = loaderResultStore.addDeferred();

            return {
              ...event,
              activityContext: loaderResultStore.withId(
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
            const loaderResultId = loaderResultStore.add(
              resolve(initialContext.initialLoaderData),
            );

            return {
              ...event,
              activityContext: loaderResultStore.withId(
                event.activityContext,
                loaderResultId,
              ),
            };
          }

          const loaderData = resolve(loadData(activityName, activityParams));
          const loaderResultId = loaderResultStore.add(loaderData);

          Promise.allSettled([loaderData]).then(([loaderDataPromiseResult]) => {
            printLoaderDataPromiseError({
              promiseResult: loaderDataPromiseResult,
              activityName: matchActivity.name,
            });
          });

          return {
            ...event,
            activityContext: loaderResultStore.withId(
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
      onBeforePush: createBeforeRouteHandler(
        input,
        loadData,
        loaderResultStore,
      ),
      onBeforeReplace: createBeforeRouteHandler(
        input,
        loadData,
        loaderResultStore,
      ),
      wrapActivity({ activity }) {
        const loaderResultPromise = loaderResultStore.get(
          loaderResultStore.getId(activity.context),
        );

        return (
          <LoaderResultContext.Provider value={loaderResultPromise}>
            {activity.render()}
          </LoaderResultContext.Provider>
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
  loaderResultStore: LoaderResultStore,
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

    const loaderResultId = loaderResultStore.add(loaderData);

    overrideActionParams({
      ...actionParams,
      activityContext: loaderResultStore.withId(
        activityContext,
        loaderResultId,
      ),
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
