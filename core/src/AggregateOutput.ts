import { PushedEvent, ReplacedEvent } from "./event-types";

export type ActivityTransitionState =
  | "enter-active"
  | "enter-done"
  | "exit-active"
  | "exit-done";

export type ActivityParams<T = { [key: string]: string | undefined }> = {
  [key in keyof T]: string | undefined;
};

export type Activity = {
  id: string;
  name: string;
  transitionState: ActivityTransitionState;
  params: ActivityParams;
  pushedBy: PushedEvent | ReplacedEvent;
};

export type AggregateOutput = {
  activities: Activity[];
  transitionDuration: number;
  globalTransitionState: "idle" | "loading";
};
