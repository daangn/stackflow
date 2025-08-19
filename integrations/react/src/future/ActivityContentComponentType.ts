import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type React from "react";

export type ActivityContentComponentType<
  ActivityName extends RegisteredActivityName,
> = React.ComponentType<{
  params: InferActivityParams<ActivityName>;
}>;
