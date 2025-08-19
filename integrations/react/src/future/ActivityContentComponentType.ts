import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ComponentType } from "react";

export type ActivityContentComponentType<
  ActivityName extends RegisteredActivityName,
> = ComponentType<{
  params: InferActivityParams<ActivityName>;
}>;
