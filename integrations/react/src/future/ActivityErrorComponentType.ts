import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ComponentType } from "react";

export type ActivityErrorComponentType<
  ActivityName extends RegisteredActivityName,
> = ComponentType<{
  params: InferActivityParams<ActivityName>;
  error: unknown;
  reset: () => void;
}>;
