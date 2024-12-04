import type {
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "./event-types";

export type ActivityTransition = "enter" | "exit";
export type ActivityTransitionProgress = "active" | "done";
export type ActivityTransitionState =
  `${ActivityTransition}-${ActivityTransitionProgress}`;

export type ActivityStep = {
  id: string;
  params: {
    [key: string]: string | undefined;
  };
  enteredBy: PushedEvent | ReplacedEvent | StepPushedEvent | StepReplacedEvent;
  exitedBy?: ReplacedEvent | PoppedEvent | StepReplacedEvent | StepPoppedEvent;
};

export type Activity = {
  id: string;
  name: string;
  transitionState: ActivityTransitionState;
  params: {
    [key: string]: string | undefined;
  };
  context?: {};
  enteredBy: PushedEvent | ReplacedEvent;
  exitedBy?: ReplacedEvent | PoppedEvent;
  steps: ActivityStep[];
  isTop: boolean;
  isActive: boolean;
  isRoot: boolean;
  zIndex: number;
};

export type RegisteredActivity = {
  name: string;
  paramsSchema?: {};
};

export type Stack = {
  activities: Activity[];
  registeredActivities: RegisteredActivity[];
  transitionDuration: number;
  globalTransitionState: "idle" | "loading" | "paused";
};
