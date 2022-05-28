export type ActivityTransitionState =
  | "enter-active"
  | "enter-done"
  | "exit-active"
  | "exit-done";

export type Activity = {
  activityId: string;
  activityName: string;
  transitionState: ActivityTransitionState;
};

export type AggregateOutput = {
  activities: Activity[];
  globalTransitionState: "idle" | "loading";
};
