import { BaseDomainEvent } from "./_base";

export type PoppedEvent = BaseDomainEvent<
  "Popped",
  { skipExitActiveState?: boolean }
>;
