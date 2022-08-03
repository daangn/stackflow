import type { BaseDomainEvent } from "./_base";

export interface ReplacedEventParams {
  [key: string]: string | undefined;
}

export type ReplacedEvent = BaseDomainEvent<
  "Replaced",
  {
    activityId: string;
    activityName: string;
    params: ReplacedEventParams;
    preloadRef?: unknown;
    skipEnterActiveState?: boolean;
    eventContext?: {};
  }
>;
