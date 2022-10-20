import type { BaseDomainEvent } from "./_base";

export interface ReplacedEventParams {
  [key: string]: string | undefined;
}

export type ReplacedEvent = BaseDomainEvent<
  "Replaced",
  {
    activityId: string;
    activityName: string;
    activityParams: ReplacedEventParams;
    skipEnterActiveState?: boolean;
    activityContext?: {};
  }
>;
