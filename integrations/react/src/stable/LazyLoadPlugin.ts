import type { StackflowReactPlugin } from "../__internal__/StackflowReactPlugin";
import type { BaseActivities } from "./BaseActivities";
import type { StackflowOptions } from "./stackflow";

export function lazyLoadPlugin<T extends BaseActivities>(
  options: StackflowOptions<T>,
): StackflowReactPlugin {
  return () => ({
    key: "plugin-lazy-load",
    onBeforePush: createBeforeRouteHandler(options),
    onBeforeReplace: createBeforeRouteHandler(options),
  });
}

type OnBeforeRoute = NonNullable<
  | ReturnType<StackflowReactPlugin>["onBeforePush"]
  | ReturnType<StackflowReactPlugin>["onBeforeReplace"]
>;

function createBeforeRouteHandler<T extends BaseActivities>(
  options: StackflowOptions<T>,
): OnBeforeRoute {
  return ({ actionParams, actions: { pause, resume } }) => {
    const { activityName } = actionParams;

    const matchActivityComponent = options.activities[activityName];

    if (!matchActivityComponent) {
      return;
    }

    const lazyComponentPromise =
      "_load" in matchActivityComponent
        ? matchActivityComponent._load?.()
        : undefined;

    if (!lazyComponentPromise) {
      return;
    }

    pause();

    lazyComponentPromise
      .catch((reason) => {
        printLazyComponentPromiseError({
          reason,
          activityName,
        });
      })
      .finally(() => {
        resume();
      });
  };
}

function printLazyComponentPromiseError({
  reason,
  activityName,
}: {
  reason: PromiseRejectedResult["reason"];
  activityName: string;
}) {
  console.error(reason);
  console.error(
    `The above error occurred while loading a lazy react component of the "${activityName}" activity`,
  );
}
