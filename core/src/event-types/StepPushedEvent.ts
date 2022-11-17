import type { BaseDomainEvent } from "./_base";

export type StepPushedEvent = BaseDomainEvent<
  "StepPushed",
  {
    stepId: string;
    stepParams: {
      [key: string]: string | undefined;
    };
  }
>;
