import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ComponentType } from "react";

export type ActivityLoadingComponentType<
  ActivityName extends RegisteredActivityName,
> = ComponentType<{ params: InferActivityParams<ActivityName> }>;
