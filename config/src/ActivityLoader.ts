import type { ActivityLoaderArgs } from "./ActivityLoaderArgs";
import type { RegisteredActivityParamTypes } from "./RegisteredActivityParamTypes";

export type ActivityLoader<
  ActivityName extends Extract<keyof RegisteredActivityParamTypes, string>,
> = (args: ActivityLoaderArgs<ActivityName>) => any;
