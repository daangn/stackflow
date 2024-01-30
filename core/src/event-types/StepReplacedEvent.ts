import type { BaseDomainEvent } from "./_base";

export type StepReplacedEvent = BaseDomainEvent<
  "StepReplaced",
  {
    stepId: string;
    stepParams: Record<string, string | undefined>;
  }
>;
