import type { ActivityBaseParams } from "./ActivityBaseParams";
import type { RegisteredActivityName } from "./RegisteredActivityName";
import type { RegisteredActivityParamTypes } from "./RegisteredActivityParamTypes";

export type InferActivityParams<ActivityName extends RegisteredActivityName> =
  RegisteredActivityParamTypes[ActivityName] extends never
    ? ActivityBaseParams
    : RegisteredActivityParamTypes[ActivityName];
