import type { BaseDomainEvent } from "./_base";

export type InitializedEvent = BaseDomainEvent<
  "Initialized",
  {
    transitionDuration: number;
  }
>;
