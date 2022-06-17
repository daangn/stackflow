import { AggregateOutput } from "../AggregateOutput";
import { DispatchEvent } from "../event-utils";

export type StackflowPluginActions = {
  /**
   * Dispatch new event to the core
   */
  dispatchEvent: DispatchEvent;

  /**
   * Get current stack state
   */
  getStack: () => AggregateOutput;
};
