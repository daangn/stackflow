import type { ActivityLoaderArgs } from "./ActivityLoaderArgs";
import type { RegisteredActivityName } from "./RegisteredActivityName";

export type ActivityLoader<ActivityName extends RegisteredActivityName> = (
  args: ActivityLoaderArgs<ActivityName>,
) => any;
