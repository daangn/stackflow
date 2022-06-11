import { AggregateOutput, DispatchEvent } from "@stackflow/core";
import { createContext } from "react";

export interface CoreActionsContextValue {
  getState: () => AggregateOutput;
  dispatchEvent: DispatchEvent;
}
export const CoreActionsContext = createContext<CoreActionsContextValue>(
  null as any,
);
