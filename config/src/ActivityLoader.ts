import type { ActivityBaseParams } from "./ActivityBaseParams";
import type { InferActivityParams } from "./InferActivityParams";
import type { RegisteredActivityParamTypes } from "./RegisteredActivityParamTypes";

export type ActivityLoaderArgs<ActivityParams extends ActivityBaseParams> = {
  params: ActivityParams;
};

export type ActivityLoader<
  ActivityName extends Extract<keyof RegisteredActivityParamTypes, string>,
> = (
  args: ActivityLoaderArgs<InferActivityParams<ActivityName>>,
) => any | Promise<any>;
