import type { BaseDomainEvent } from "./_base";

export type NestedPushedEvent = BaseDomainEvent<
  "NestedPushed",
  {
    activityParams: {
      [key: string]: string | undefined;
    };
  }
>;
