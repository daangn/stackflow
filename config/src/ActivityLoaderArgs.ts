import type { ActivityDefinition } from "./ActivityDefinition";
import type { Config } from "./Config";
import type { InferActivityParams } from "./InferActivityParams";
import type { RegisteredActivityParamTypes } from "./RegisteredActivityParamTypes";

export type ActivityLoaderArgs<
  ActivityName extends Extract<keyof RegisteredActivityParamTypes, string>,
> = {
  params: InferActivityParams<ActivityName>;
  config: Config<
    ActivityDefinition<Extract<keyof RegisteredActivityParamTypes, string>>
  >;
};
