import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ComponentType, ReactNode } from "react";

export type ActivityLayoutComponentType<
  ActivityName extends RegisteredActivityName,
> = ComponentType<{
  params: InferActivityParams<ActivityName>;
  children: ReactNode;
}>;
