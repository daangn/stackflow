import type { Activity } from "@stackflow/core";

import type { ActivityLoaderArgs } from "./ActivityLoaderArgs";
import type { RegisteredActivityName } from "./RegisteredActivityName";

export type ActivityLoader<ActivityName extends RegisteredActivityName> = (
  args: ActivityLoaderArgs<ActivityName>,
) => any;

export function loader<ActivityName extends RegisteredActivityName>(
  loaderFn: (args: ActivityLoaderArgs<ActivityName>) => any,
): ActivityLoader<ActivityName> {
  return (args: ActivityLoaderArgs<ActivityName>) => loaderFn(args);
}

export interface ActivityLoaderConfigObject<
  ActivityName extends RegisteredActivityName,
> {
  fn: ActivityLoader<ActivityName>;
  shouldInvalidate?: (args: {
    prevActivity: Activity;
    currentActivity: Activity;
  }) => boolean;
}

export type ActivityLoaderConfig<ActivityName extends RegisteredActivityName> =
  | ActivityLoader<ActivityName>
  | ActivityLoaderConfigObject<ActivityName>;

export function getLoaderFn<ActivityName extends RegisteredActivityName>(
  loaderConfig: ActivityLoaderConfig<ActivityName> | undefined,
): ActivityLoader<ActivityName> | undefined {
  if (!loaderConfig) {
    return undefined;
  }
  if (typeof loaderConfig === "function") {
    return loaderConfig;
  }
  return loaderConfig.fn;
}

export function getShouldInvalidate<ActivityName extends RegisteredActivityName>(
  loaderConfig: ActivityLoaderConfig<ActivityName> | undefined,
): ActivityLoaderConfigObject<ActivityName>["shouldInvalidate"] | undefined {
  if (!loaderConfig || typeof loaderConfig === "function") {
    return undefined;
  }
  return loaderConfig.shouldInvalidate;
}
