import type {
  InferActivityParams,
  RegisteredActivityParamTypes,
} from "@stackflow/config";
import type { Component } from "solid-js";

export type ActivityComponentType<
  ActivityName extends Extract<keyof RegisteredActivityParamTypes, string>,
> = Component<{ params: InferActivityParams<ActivityName> }>;
