import { BaseEvent } from "../$base/BaseEvent";

export type ActivityRegisteredEvent = BaseEvent<
  "ActivityRegistered",
  {
    activityName: string;
  }
>;
