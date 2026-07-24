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
import {
  defer,
  inspect,
  PromiseStatus,
  resolve,
  type SyncInspectableDeferred,
  type SyncInspectablePromise,
} from "../utils/SyncInspectablePromise";
import { LoaderDataProvider } from "./LoaderDataContext";

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
    // React may still render an older deferred stack after core advances, so
    // entered generations remain available until this plugin instance is released.
    const loaderDataByEventId = new Map<
      string,
      SyncInspectablePromise<unknown>
    >();
    const runtimeLoaderDataByActivityId = new Map<
      string,
      SyncInspectablePromise<unknown>
    >();
    const loadPathDeferreds = new Map<
      string,
      SyncInspectableDeferred<unknown>
    >();

    const promoteRuntimeLoaderData = (stack: Stack) => {
      const promote = (activityId: string, eventId: string) => {
        if (loaderDataByEventId.has(eventId)) {
          return;
        }

        const loaderData = runtimeLoaderDataByActivityId.get(activityId);
        if (!loaderData) {
          return;
        }

        loaderDataByEventId.set(eventId, loaderData);
        runtimeLoaderDataByActivityId.delete(activityId);
      };

      // A paused replacement may reuse the current activity ID, so the staged
      // value belongs to the newest queued generation rather than its predecessor.
      stack.pausedEvents
        ?.slice()
        .reverse()
        .forEach((event) => {
          if (event.name === "Pushed" || event.name === "Replaced") {
            promote(event.activityId, event.id);
          }
        });
      stack.activities.forEach((activity) => {
        promote(activity.id, activity.enteredBy.id);
      });
    };

    const resolveDeferredLoaderData = ({
      eventId,
      activityName,
      activityParams,
    }: {
      eventId: string;
      activityName: string;
      activityParams: {};
    }) => {
      const matchActivity = input.config.activities.find(
        (candidate) => candidate.name === activityName,
      );
      const loaderData = loaderDataByEventId.get(eventId);
      const deferred = loadPathDeferreds.get(eventId);

      if (!matchActivity?.loader || !loaderData || !deferred) {
        return;
      }

      loadPathDeferreds.delete(eventId);

      Promise.allSettled([loaderData]).then(([loaderDataPromiseResult]) => {
        printLoaderDataPromiseError({
          promiseResult: loaderDataPromiseResult,
          activityName: matchActivity.name,
        });
      });

      try {
        deferred.resolve(loadData(activityName, activityParams));
      } catch (error) {
        deferred.reject(error);
      }
    };

    const resolveRestoredStackLoaderData = (stack: Stack) => {
      stack.activities
        .filter((activity) => activity.transitionState !== "exit-done")
        .forEach((activity) => {
          resolveDeferredLoaderData({
            eventId: activity.enteredBy.id,
            activityName: activity.name,
            activityParams: activity.params,
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
          eventId: event.id,
          activityName: event.activityName,
          activityParams: event.activityParams,
        });
      });
    };

    return {
      key: "plugin-loader",
      wrapActivity({ activity }) {
        return (
          <LoaderDataProvider
            value={
              loaderDataByEventId.get(activity.enteredBy.id) ??
              runtimeLoaderDataByActivityId.get(activity.id)
            }
          >
            {activity.render()}
          </LoaderDataProvider>
        );
      },
      overrideInitialEvents({ initialEvents, initialContext, initInfo }) {
        loaderDataByEventId.clear();
        runtimeLoaderDataByActivityId.clear();
        loadPathDeferreds.clear();

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
            loaderDataByEventId.set(event.id, loaderData.promise);
            loadPathDeferreds.set(event.id, loaderData);

            return event;
          });
        }

        return initialEvents.map((event) => {
          if (event.name !== "Pushed" && event.name !== "Replaced") {
            return event;
          }

          if (initialContext.initialLoaderData) {
            loaderDataByEventId.set(
              event.id,
              resolve(initialContext.initialLoaderData),
            );
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

          const loaderData = resolve(loadData(activityName, activityParams));

          Promise.allSettled([loaderData]).then(([loaderDataPromiseResult]) => {
            printLoaderDataPromiseError({
              promiseResult: loaderDataPromiseResult,
              activityName: matchActivity.name,
            });
          });

          loaderDataByEventId.set(event.id, loaderData);
          return event;
        });
      },
      onInit({ actions, initInfo }) {
        if (initInfo?.kind === "load") {
          const stack = actions.getStack();

          resolveRestoredStackLoaderData(stack);
          resolvePausedEventLoaderData(stack.pausedEvents);
        }
      },
      onChanged({ actions }) {
        const stack = actions.getStack();
        promoteRuntimeLoaderData(stack);
      },
      onBeforePush: createBeforeRouteHandler({
        input,
        loadData,
        runtimeLoaderDataByActivityId,
      }),
      onBeforeReplace: createBeforeRouteHandler({
        input,
        loadData,
        runtimeLoaderDataByActivityId,
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
  runtimeLoaderDataByActivityId,
}: {
  input: StackflowInput<T, R>;
  loadData: (activityName: string, activityParams: {}) => unknown;
  runtimeLoaderDataByActivityId: Map<string, SyncInspectablePromise<unknown>>;
}): OnBeforeRoute {
  return ({ actionParams, actions }) => {
    const { activityId, activityName, activityParams, activityContext } =
      actionParams;

    // A canceled attempt has no entry generation, so its alias cannot belong
    // to a later route attempt that reuses the same activity ID.
    runtimeLoaderDataByActivityId.delete(activityId);

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
      // Stage after a possible pause so that pause's own change notification
      // cannot associate a same-ID replacement with the current generation.
      runtimeLoaderDataByActivityId.set(activityId, loaderData);

      Promise.resolve().then(() => {
        // Core route dispatch is synchronous. A value that was not promoted by
        // the next microtask belongs to an action that never reached the stack.
        if (runtimeLoaderDataByActivityId.get(activityId) === loaderData) {
          runtimeLoaderDataByActivityId.delete(activityId);
        }
      });
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
