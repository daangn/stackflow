import { useContext } from "react";

import type {
  InferActivityParams,
  RegisteredActivityParamTypes,
} from "@stackflow/config";
import { ActivityContext } from "../__internal__/activity/ActivityProvider";

export function useActivityParams<
  ActivityName extends Extract<keyof RegisteredActivityParamTypes, string>,
>(): InferActivityParams<ActivityName> {
  return useContext(ActivityContext)
    .params as InferActivityParams<ActivityName>;
}
