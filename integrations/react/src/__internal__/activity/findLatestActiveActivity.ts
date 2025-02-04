import type { Activity } from "@stackflow/core";

function isActivityNotExited(activity: Activity) {
  return !activity.exitedBy;
}

function compareActivitiesByEventDate(a1: Activity, a2: Activity) {
  return a2.enteredBy.eventDate - a1.enteredBy.eventDate;
}

export function findLatestActiveActivity(activities: Activity[]) {
  return activities
    .filter(isActivityNotExited)
    .sort(compareActivitiesByEventDate)[0];
}
