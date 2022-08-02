import type { AggregateOutput, DispatchEvent } from "@stackflow/core";
import { createContext } from "react";

export interface CoreActionsContextValue {
  getStack: () => AggregateOutput;
  dispatchEvent: DispatchEvent;
}
export const CoreActionsContext = createContext<CoreActionsContextValue>(
  null as any,
);
