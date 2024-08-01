import type { ActivityBaseParams } from "./ActivityBaseParams";
import type { RegisteredActivityParamTypes } from "./RegisteredActivityParamTypes";

export type InferActivityParams<
  ActivityName extends Extract<keyof RegisteredActivityParamTypes, string>,
> = RegisteredActivityParamTypes[ActivityName] extends never
  ? ActivityBaseParams
  : RegisteredActivityParamTypes[ActivityName];
