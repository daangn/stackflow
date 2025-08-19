import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type React from "react";

export type ActivityLoadingComponentType<
  ActivityName extends RegisteredActivityName,
> = React.ComponentType<{ params: InferActivityParams<ActivityName> }>;
