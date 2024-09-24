import type { AllActivityName, InferActivityParams } from "@stackflow/config";
import type React from "react";

export type ActivityComponentType<ActivityName extends AllActivityName> =
  React.ComponentType<{ params: InferActivityParams<ActivityName> }>;
