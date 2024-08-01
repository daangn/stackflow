import type { ActivityBaseParams } from "./ActivityBaseParams";
import type { Register } from "./Register";

export type RegisteredActivityParamTypes = keyof Register extends never
  ? {
      [key: string]: ActivityBaseParams;
    }
  : Register;
