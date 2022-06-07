import { AggregateOutput, DispatchEvent } from "@stackflow/core";

export type CoreActions = {
  dispatchEvent: DispatchEvent;
  getState: () => AggregateOutput;
};
