import { BaseEvent } from "../$base/BaseEvent";

export type InitializedEvent = BaseEvent<
  "Initialized",
  {
    transitionDuration: number;
  }
>;
