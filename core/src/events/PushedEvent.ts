import { BaseEvent } from "../$base/BaseEvent";

export type PushedEvent = BaseEvent<
  "Pushed",
  {
    activityId: string;
    activityName: string;
  }
>;
