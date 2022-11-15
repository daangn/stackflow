import type { BaseDomainEvent } from "./_base";

export type NestedReplacedEvent = BaseDomainEvent<
  "NestedReplaced",
  {
    activityParams: {
      [key: string]: string | undefined;
    };
  }
>;
