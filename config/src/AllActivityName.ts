import type { RegisteredActivityParamTypes } from "./RegisteredActivityParamTypes";

export type AllActivityName = Extract<
  keyof RegisteredActivityParamTypes,
  string
>;
