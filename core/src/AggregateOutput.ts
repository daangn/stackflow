import type {
  PushedEvent,
  ReplacedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "./event-types";

export type ActivityTransitionState =
  | "enter-active"
  | "enter-done"
  | "exit-active"
  | "exit-done";

export type ActivityStep = {
  id: string;
  params: {
    [key: string]: string | undefined;
  };
  pushedBy: PushedEvent | ReplacedEvent | StepPushedEvent | StepReplacedEvent;
};

export type Activity = {
  id: string;
  name: string;
  transitionState: ActivityTransitionState;
  params: {
    [key: string]: string | undefined;
  };
  context?: {};
  pushedBy: PushedEvent | ReplacedEvent;
  steps: ActivityStep[];
  isTop: boolean;
  isActive: boolean;
  zIndex: number;
};

export type RegisteredActivity = {
  name: string;
  paramsSchema?: {};
};

export type AggregateOutput = {
  activities: Activity[];
  registeredActivities: RegisteredActivity[];
  transitionDuration: number;
  globalTransitionState: "idle" | "loading";
};
