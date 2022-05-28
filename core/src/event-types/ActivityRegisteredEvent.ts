import { BaseDomainEvent } from "./_base";

export type ActivityRegisteredEvent = BaseDomainEvent<
  "ActivityRegistered",
  {
    activityName: string;
  }
>;
