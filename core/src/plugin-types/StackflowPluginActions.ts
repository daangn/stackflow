import { AggregateOutput } from "../AggregateOutput";
import { DispatchEvent } from "../event-utils";

export type StackflowPluginActions = {
  dispatchEvent: DispatchEvent;
  getState: () => AggregateOutput;
};
