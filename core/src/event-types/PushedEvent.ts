import { BaseDomainEvent } from "./_base";

export type PushedEvent = BaseDomainEvent<
  "Pushed",
  {
    activityId: string;
    activityName: string;
  }
>;
