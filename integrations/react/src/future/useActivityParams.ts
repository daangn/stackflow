import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useContext } from "react";
import { ActivityContext } from "../__internal__/activity/ActivityProvider";

export function useActivityParams<
  ActivityName extends RegisteredActivityName,
>(): InferActivityParams<ActivityName> {
  const context = useContext(ActivityContext);

  if (!context) {
    throw new Error("useActivityParams must be used within Stack");
  }

  return context.params as InferActivityParams<ActivityName>;
}
