import type { BaseDomainEvent } from "./_base";

export type NestedReplacedEvent = BaseDomainEvent<
  "NestedReplaced",
  {
    activityNestedRouteId: string;
    activityNestedRouteParams: {
      [key: string]: string | undefined;
    };
  }
>;
