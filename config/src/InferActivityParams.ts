import type { ActivityBaseParams } from "./ActivityBaseParams";
import type { AllActivityName } from "./AllActivityName";
import type { RegisteredActivityParamTypes } from "./RegisteredActivityParamTypes";

export type InferActivityParams<ActivityName extends AllActivityName> =
  RegisteredActivityParamTypes[ActivityName] extends never
    ? ActivityBaseParams
    : RegisteredActivityParamTypes[ActivityName];
