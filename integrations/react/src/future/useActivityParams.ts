import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useContext } from "react";
import { ActivityContext } from "../__internal__/activity/ActivityProvider";

export function useActivityParams<
  ActivityName extends RegisteredActivityName,
>(): InferActivityParams<ActivityName> {
  return useContext(ActivityContext)
    .params as InferActivityParams<ActivityName>;
}
