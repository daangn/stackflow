import type { RegisteredActivityParamTypes } from "./RegisteredActivityParamTypes";

export type RegisteredActivityName = Extract<
  keyof RegisteredActivityParamTypes,
  string
>;
