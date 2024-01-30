import type { BaseDomainEvent } from "./_base";

export type PushedEvent = BaseDomainEvent<
  "Pushed",
  {
    activityId: string;
    activityName: string;
    activityParams: Record<string, string | undefined>;
    skipEnterActiveState?: boolean;
    activityContext?: {};
  }
>;
