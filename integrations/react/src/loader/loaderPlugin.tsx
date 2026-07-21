import type {
  ActivityDefinition,
  RegisteredActivityName,
} from "@stackflow/config";
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
  type SyncInspectableDeferred,
  type SyncInspectablePromise,
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
    const loadPathDeferreds = new WeakMap<
      SyncInspectablePromise<unknown>,
      SyncInspectableDeferred<unknown>
    >();

    const resolveLoadPathLoaderData = (actions: LoaderPluginActions) => {
      actions
        .getStack()
        .activities.filter(
          (activity) => activity.transitionState !== "exit-done",
        )
        .forEach((activity) => {
          const matchActivity = input.config.activities.find(
            (candidate) => candidate.name === activity.name,
          );

          if (!matchActivity?.loader) {
            return;
          }

          const loaderData = (activity.context as any)?.loaderData as
            | SyncInspectablePromise<unknown>
            | undefined;
          const deferred = loaderData
            ? loadPathDeferreds.get(loaderData)
            : undefined;

          if (!loaderData || !deferred) {
            return;
          }

          loadPathDeferreds.delete(loaderData);

          Promise.allSettled([loaderData]).then(([loaderDataPromiseResult]) => {
            printLoaderDataPromiseError({
              promiseResult: loaderDataPromiseResult,
              activityName: matchActivity.name,
            });
          });

          try {
            deferred.resolve(loadData(activity.name, activity.params));
          } catch (error) {
            deferred.reject(error);
          }
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

            const loaderData = defer<unknown>();
            loadPathDeferreds.set(loaderData.promise, loaderData);

            return {
              ...event,
              activityContext: {
                ...event.activityContext,
                loaderData: loaderData.promise,
              },
            };
          });
        }

        return initialEvents.map((event) => {
          if (event.name !== "Pushed" && event.name !== "Replaced") {
            return event;
          }

          if (initialContext.initialLoaderData) {
            return {
              ...event,
              activityContext: {
                ...event.activityContext,
                loaderData: resolve(initialContext.initialLoaderData),
              },
            };
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

          return {
            ...event,
            activityContext: {
              ...event.activityContext,
              loaderData,
            },
          };
        });
      },
      onInit({ actions, initInfo }) {
        if (initInfo?.kind !== "load") {
          return;
        }

        resolveLoadPathLoaderData(actions);
      },
      onResumed({ actions }) {
        resolveLoadPathLoaderData(actions);
      },
      onPushed({ actions }) {
        resolveLoadPathLoaderData(actions);
      },
      onReplaced({ actions }) {
        resolveLoadPathLoaderData(actions);
      },
      onBeforePush: createBeforeRouteHandler(input, loadData),
      onBeforeReplace: createBeforeRouteHandler(input, loadData),
    };
  };
}

type OnBeforeRoute = NonNullable<
  | ReturnType<StackflowReactPlugin>["onBeforePush"]
  | ReturnType<StackflowReactPlugin>["onBeforeReplace"]
>;
type LoaderPluginActions = Parameters<
  NonNullable<ReturnType<StackflowReactPlugin>["onInit"]>
>[0]["actions"];

function createBeforeRouteHandler<
  T extends ActivityDefinition<RegisteredActivityName>,
  R extends {
    [activityName in RegisteredActivityName]: ActivityComponentType<any>;
  },
>(
  input: StackflowInput<T, R>,
  loadData: (activityName: string, activityParams: {}) => unknown,
): OnBeforeRoute {
  return ({
    actionParams,
    actions: { overrideActionParams, pause, resume },
  }) => {
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

    overrideActionParams({
      ...actionParams,
      activityContext: {
        ...activityContext,
        loaderData,
      },
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
