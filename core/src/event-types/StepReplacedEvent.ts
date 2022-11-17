import type { BaseDomainEvent } from "./_base";

export type StepReplacedEvent = BaseDomainEvent<
  "StepReplaced",
  {
    stepId: string;
    stepParams: {
      [key: string]: string | undefined;
    };
  }
>;
