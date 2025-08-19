import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type React from "react";

export type ActivityErrorComponentType<
  ActivityName extends RegisteredActivityName,
> = React.ComponentType<{
  params: InferActivityParams<ActivityName>;
  error: unknown;
  reset: () => void;
}>;
