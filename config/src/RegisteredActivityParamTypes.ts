import type { Register } from "./Register";

export type RegisteredActivityParamTypes = Register extends {
  activityParamTypes: {};
}
  ? Register["activityParamTypes"]
  : {};
