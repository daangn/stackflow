import type {
  ActivityDefinition,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ActivityComponentType } from "../../__internal__/ActivityComponentType";
import type { StackflowReactPlugin } from "../../__internal__/StackflowReactPlugin";
import {
  getContentComponent,
  isStructuredActivityComponent,
} from "../../__internal__/StructuredActivityComponentType";
import { isPromiseLike } from "../../__internal__/utils/isPromiseLike";
import {
  inspect,
  PromiseStatus,
  resolve,
} from "../../__internal__/utils/SyncInspectablePromise";
import type { StackflowInput } from "../stackflow";

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
    return {
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
      onBeforePush: createBeforeRouteHandler(input, loadData),
      onBeforeReplace: createBeforeRouteHandler(input, loadData),
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
