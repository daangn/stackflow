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

    const loader = matchActivity?.loader;

    if (!loader || !matchActivityComponent) {
      return;
    }

    const loaderData = loader({
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
    Promise.all([loaderDataPromise, lazyComponentPromise]).finally(() => {
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
