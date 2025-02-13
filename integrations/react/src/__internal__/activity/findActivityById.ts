import type { Activity } from "@stackflow/core";

export const findActivityById =
  (id: string) =>
  (activities: Activity[]): Activity | undefined =>
    activities.find(({ id: activityId }) => activityId === id);
