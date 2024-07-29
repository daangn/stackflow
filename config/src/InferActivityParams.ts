import type { ActivityBaseParams } from "./ActivityBaseParams";
import type { RegisteredActivityParamTypes } from "./RegisteredActivityParamTypes";

export type InferActivityParams<ActivityName extends string> =
  ActivityName extends keyof RegisteredActivityParamTypes
    ? RegisteredActivityParamTypes[ActivityName]
    : ActivityBaseParams;
