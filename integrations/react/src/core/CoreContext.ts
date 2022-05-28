import { AggregateOutput, makeEvent } from "@stackflow/core";
import { createContext } from "react";

export interface CoreContextValue {
  aggregateOutput: AggregateOutput;
  dispatchEvent: typeof makeEvent;
}
export const CoreContext = createContext<CoreContextValue>(null as any);
