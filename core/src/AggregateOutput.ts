import type {
  NestedPushedEvent,
  NestedReplacedEvent,
  PushedEvent,
  ReplacedEvent,
} from "./event-types";

export type ActivityTransitionState =
  | "enter-active"
  | "enter-done"
  | "exit-active"
  | "exit-done";

export type ActivityNestedRoute = {
  id: string;
  params: {
    [key: string]: string | undefined;
  };
  pushedBy: NestedPushedEvent | NestedReplacedEvent;
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
  nestedReplacedBy?: NestedReplacedEvent;
  nestedRoutes?: ActivityNestedRoute[];
  isTop: boolean;
  isActive: boolean;
  zIndex: number;
};

export type AggregateOutput = {
  activities: Activity[];
  transitionDuration: number;
  globalTransitionState: "idle" | "loading";
};
