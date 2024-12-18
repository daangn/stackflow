import type { ActivityDefinition } from "@stackflow/config";
import type { ActivityComponentType } from "../../__internal__/ActivityComponentType";
import type { LazyActivityComponentType } from "../../__internal__/LazyActivityComponentType";
import type { StackflowReactPlugin } from "../../__internal__/StackflowReactPlugin";
import type { StackflowInput } from "../stackflow";

export function loaderPlugin<
  T extends ActivityDefinition<string>,
  R extends {
    [activityName in T["name"]]:
      | ActivityComponentType<any>
      | LazyActivityComponentType<any>;
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
    onBeforePush({
      actionParams,
      actions: { overrideActionParams, dispatchEvent },
    }) {
      const { activityName, activityParams, activityContext } = actionParams;

      const matchActivity = input.config.activities.find(
        (activity) => activity.name === activityName,
      );
      const matchActivityComponent =
        input.components[activityName as T["name"]];

      const loader = matchActivity?.loader;

      if (!loader || !matchActivityComponent) {
        return;
      }

      const loaderData = loader({
        params: activityParams,
        config: input.config,
      });

      if (
        loaderData instanceof Promise ||
        "_stackflow" in matchActivityComponent
      ) {
        dispatchEvent("Paused", {});
      }

      const promises: Array<Promise<any>> = [];

      if (loaderData instanceof Promise) {
        promises.push(loaderData);
      }
      if (
        "_stackflow" in matchActivityComponent &&
        matchActivityComponent._stackflow?.type === "lazy"
      ) {
        promises.push(matchActivityComponent._stackflow.load());
      }

      Promise.all(promises).finally(() => {
        dispatchEvent("Resumed", {});
      });

      overrideActionParams({
        ...actionParams,
        activityContext: {
          ...activityContext,
          loaderData,
        },
      });
    },
    onBeforeReplace({
      actionParams,
      actions: { overrideActionParams, dispatchEvent },
    }) {
      const { activityName, activityParams, activityContext } = actionParams;

      const matchActivity = input.config.activities.find(
        (activity) => activity.name === activityName,
      );
      const matchActivityComponent =
        input.components[activityName as T["name"]];

      const loader = matchActivity?.loader;

      if (!loader || !matchActivityComponent) {
        return;
      }

      const loaderData = loader({
        params: activityParams,
        config: input.config,
      });

      if (
        loaderData instanceof Promise ||
        "_stackflow" in matchActivityComponent
      ) {
        dispatchEvent("Paused", {});
      }

      const promises: Array<Promise<any>> = [];

      if (loaderData instanceof Promise) {
        promises.push(loaderData);
      }
      if (
        "_stackflow" in matchActivityComponent &&
        matchActivityComponent._stackflow?.type === "lazy"
      ) {
        promises.push(matchActivityComponent._stackflow.load());
      }

      Promise.all(promises).finally(() => {
        dispatchEvent("Resumed", {});
      });

      overrideActionParams({
        ...actionParams,
        activityContext: {
          ...activityContext,
          loaderData,
        },
      });
    },
  });
}
