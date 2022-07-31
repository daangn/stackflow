import { AggregateOutput } from "../AggregateOutput";
import { PoppedEvent, PushedEvent, ReplacedEvent } from "../event-types";
import { BaseDomainEvent } from "../event-types/_base";
import { DispatchEvent } from "../event-utils";

export type StackflowPluginActions = {
  /**
   * Push new activity
   */
  push: (params: Omit<PushedEvent, keyof BaseDomainEvent>) => void;

  /**
   * Push new activity in the top and remove current top activity when new activity is activated
   */
  replace: (params: Omit<ReplacedEvent, keyof BaseDomainEvent>) => void;

  /**
   * Remove top activity
   */
  pop: (params?: Omit<PoppedEvent, keyof BaseDomainEvent>) => void;

  /**
   * Get current stack state
   */
  getStack: () => AggregateOutput;

  /**
   * Dispatch new event to the core without pre-effect hooks
   */
  dispatchEvent: DispatchEvent;
};
