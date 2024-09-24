import type { ActivityLoaderArgs } from "./ActivityLoaderArgs";
import type { AllActivityName } from "./AllActivityName";

export type ActivityLoader<ActivityName extends AllActivityName> = (
  args: ActivityLoaderArgs<ActivityName>,
) => any;
