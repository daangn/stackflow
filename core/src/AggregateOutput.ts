export type AggregateOutput = {
  activities: Array<{
    activityId: string;
    activityName: string;
  }>;
  transition: {
    state: "idle" | "loading";
  };
};
