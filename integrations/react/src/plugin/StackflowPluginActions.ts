import { AggregateOutput, DispatchEvent } from "@stackflow/core";

export type StackflowPluginActions = {
  dispatchEvent: DispatchEvent;
  getState: () => AggregateOutput;
};
