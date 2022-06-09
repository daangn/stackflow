import { AggregateOutput, DispatchEvent } from "@stackflow/core";
import { createContext } from "react";

export interface StackContextValue {
  state: AggregateOutput;
  getState: () => AggregateOutput;
  dispatchEvent: DispatchEvent;
}
export const StackContext = createContext<StackContextValue>(null as any);
