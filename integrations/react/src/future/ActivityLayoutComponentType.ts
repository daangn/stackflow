import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ComponentType } from "react";

export type ActivityLayoutComponentType<
  ActivityName extends RegisteredActivityName,
> = ComponentType<{
  params: InferActivityParams<ActivityName>;
  children: React.ReactNode;
}>;
