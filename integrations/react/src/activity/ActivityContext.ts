import { Activity } from "@stackflow/core";
import { createContext } from "react";

export interface ActivityContextValue {
  state: Activity;
}
export const ActivityContext = createContext<ActivityContextValue>(null as any);
