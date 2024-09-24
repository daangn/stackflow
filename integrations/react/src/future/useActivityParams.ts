import { useContext } from "react";

import type { AllActivityName, InferActivityParams } from "@stackflow/config";
import { ActivityContext } from "../__internal__/activity/ActivityProvider";

export function useActivityParams<
  ActivityName extends AllActivityName,
>(): InferActivityParams<ActivityName> {
  return useContext(ActivityContext)
    .params as InferActivityParams<ActivityName>;
}
