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
