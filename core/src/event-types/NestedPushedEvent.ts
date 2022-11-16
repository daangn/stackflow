import type { BaseDomainEvent } from "./_base";

export type NestedPushedEvent = BaseDomainEvent<
  "NestedPushed",
  {
    activityNestedRouteId: string;
    activityNestedRouteParams: {
      [key: string]: string | undefined;
    };
  }
>;
