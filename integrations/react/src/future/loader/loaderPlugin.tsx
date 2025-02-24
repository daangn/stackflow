import type {
  ActivityDefinition,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ActivityComponentType } from "../../__internal__/ActivityComponentType";
import type { StackflowReactPlugin } from "../../__internal__/StackflowReactPlugin";
import type { StackflowInput } from "../stackflow";

export function loaderPlugin<
  T extends ActivityDefinition<RegisteredActivityName>,
  R extends {
    [activityName in RegisteredActivityName]: ActivityComponentType<any>;
  },
>(input: StackflowInput<T, R>): StackflowReactPlugin {
  return () => ({
    key: "plugin-loader",
    overrideInitialEvents({ initialEvents, initialContext }) {
      if (initialEvents.length === 0) {
        return [];
      }

      return initialEvents.map((event) => {
        if (event.name !== "Pushed") {
          return event;
        }

        if (initialContext.initialLoaderData) {
          return {
            ...event,
            activityContext: {
              ...event.activityContext,
              loaderData: initialContext.initialLoaderData,
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

        const loaderData = loader({
          params: activityParams,
          config: input.config,
        });

        if (loaderData instanceof Promise) {
          Promise.allSettled([loaderData]).then(([loaderDataPromiseResult]) => {
            printLoaderDataPromiseError({
              promiseResult: loaderDataPromiseResult,
              activityName: matchActivity.name,
            });
          });
        }

        return {
          ...event,
          activityContext: {
            ...event.activityContext,
            loaderData,
          },
        };
      });
    },
    onBeforePush: createBeforeRouteHandler(input),
    onBeforeReplace: createBeforeRouteHandler(input),
  });
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
>(input: StackflowInput<T, R>): OnBeforeRoute {
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

    const loaderData = matchActivity.loader?.({
      params: activityParams,
      config: input.config,
    });

    const loaderDataPromise =
      loaderData instanceof Promise ? loaderData : undefined;
    const lazyComponentPromise =
      "_load" in matchActivityComponent
        ? matchActivityComponent._load?.()
        : undefined;

    if (loaderDataPromise || lazyComponentPromise) {
      pause();
    }
    Promise.allSettled([loaderDataPromise, lazyComponentPromise])
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
