import type {
  ActivityDefinition,
  RegisteredActivityName,
} from "@stackflow/config";
import {
  type ActivityComponentType,
  isMonolithicActivityComponentType,
} from "../../__internal__/ActivityComponentType";
import { isLazyActivityComponentType } from "../../__internal__/MonolithicActivityComponentType";
import type { StackflowReactPlugin } from "../../__internal__/StackflowReactPlugin";
import { isStructuredActivityComponent } from "../../__internal__/StructuredActivityComponentType";
import {
  inspect,
  liftValue,
  PromiseStatus,
  type SyncInspectablePromise,
} from "../../__internal__/utils/SyncInspectablePromise";
import type { StackflowInput } from "../stackflow";

export function loaderPlugin<
  T extends ActivityDefinition<RegisteredActivityName>,
  R extends {
    [activityName in RegisteredActivityName]: ActivityComponentType<any>;
  },
>(
  input: StackflowInput<T, R>,
  loadData: (
    activityName: string,
    activityParams: {},
  ) => SyncInspectablePromise<unknown>,
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
                loaderData: liftValue(initialContext.initialLoaderData),
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

          const loaderData = loadData(activityName, activityParams);

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
  loadData: (
    activityName: string,
    activityParams: {},
  ) => SyncInspectablePromise<unknown>,
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
      matchActivity.loader && loadData(activityName, activityParams);
    const lazyComponentPromise = liftValue(
      isStructuredActivityComponent(matchActivityComponent) &&
        typeof matchActivityComponent.content === "function"
        ? matchActivityComponent.content()
        : isMonolithicActivityComponentType(matchActivityComponent) &&
            isLazyActivityComponentType(matchActivityComponent)
          ? matchActivityComponent._load?.()
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
