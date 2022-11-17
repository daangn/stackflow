import type { BaseDomainEvent } from "./_base";

export type ReplacedEvent = BaseDomainEvent<
  "Replaced",
  {
    activityId: string;
    activityName: string;
    activityParams: {
      [key: string]: string | undefined;
    };
    skipEnterActiveState?: boolean;
    activityContext?: {};
  }
>;
