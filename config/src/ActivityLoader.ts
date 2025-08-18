import type { ActivityLoaderArgs } from "./ActivityLoaderArgs";
import type { RegisteredActivityName } from "./RegisteredActivityName";

export type ActivityLoader<ActivityName extends RegisteredActivityName> = {
  (args: ActivityLoaderArgs<ActivityName>): any;
  loaderCacheMaxAge?: number;
};

export function loader<ActivityName extends RegisteredActivityName>(
  loaderFn: (args: ActivityLoaderArgs<ActivityName>) => any,
  options?: {
    loaderCacheMaxAge?: number;
  },
): ActivityLoader<ActivityName> {
  return Object.assign(
    (args: ActivityLoaderArgs<ActivityName>) => loaderFn(args),
    options,
  );
}
