import type { ActivityBaseParams } from "./ActivityBaseParams";
import type { Register } from "./Register";

export type RegisteredActivityParamTypes = Register extends {
  activityParamTypes: {};
}
  ? Register["activityParamTypes"]
  : { [key: string]: ActivityBaseParams };
