import type { Effect } from "../Effect";
import type { DomainEvent } from "../event-types";
import type { Stack } from "../Stack";

export interface Aggregator {
  getStack(): Stack;
  dispatchEvent(event: DomainEvent): void;
  subscribeChanges: (
    listener: (effects: Effect[], stack: Stack) => void,
  ) => () => void;
}
