import type { InferActivityParams } from "./InferActivityParams";
import type { RegisteredActivityParamTypes } from "./RegisteredActivityParamTypes";
import type { RegisterActivityLoaderArgs } from "./RegisterActivityLoaderArgs"

export interface ActivityLoaderArgs<
  ActivityName extends Extract<keyof RegisteredActivityParamTypes, string>,
> extends RegisterActivityLoaderArgs {
  params: InferActivityParams<ActivityName>;
};
