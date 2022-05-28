export type AggregateOutput = {
  activities: Array<{
    activityId: string;
    activityName: string;
    transition: {
      state: "enter-active" | "enter-done" | "exit-active" | "exit-done";
    };
  }>;
  transition: {
    state: "idle" | "loading";
  };
};

export type ActivityTransitionState =
  | "enter-active"
  | "enter-done"
  | "exit-active"
  | "exit-done";

export type Activity = {
  activityId: string;
  activityName: string;
  transition: {
    state: ActivityTransitionState;
  };
};
