import type { BaseDomainEvent } from "./_base";

export type ResumedEvent = BaseDomainEvent<
  "Resumed",
  {
    activityId: string;
  }
>;
