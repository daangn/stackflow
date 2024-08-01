import type {
  InferActivityParams,
  RegisteredActivityParamTypes,
} from "@stackflow/config";
import type React from "react";

export type ActivityComponentType<
  ActivityName extends Extract<keyof RegisteredActivityParamTypes, string>,
> = React.ComponentType<{ params: InferActivityParams<ActivityName> }>;
