export type ActivityTransitionState =
  | "enter"
  | "enter-active"
  | "enter-done"
  | "exit-active"
  | "exit-done";

export type Activity = {
  id: string;
  name: string;
  transitionState: ActivityTransitionState;
};

export type AggregateOutput = {
  activities: Activity[];
  globalTransitionState: "idle" | "loading";
};
