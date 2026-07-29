import type { DomainEvent } from "../event-types";
import type { Activity, ActivityTransitionState } from "../Stack";
import { findIndices, last } from "../utils";

function isActivityNotExited(activity: Activity) {
  return !activity.exitedBy;
}

function compareActivitiesByEventDate(a1: Activity, a2: Activity) {
  return a2.enteredBy.eventDate - a1.enteredBy.eventDate;
}

function findLatestActiveActivity(activities: Activity[]) {
  return activities
    .filter(isActivityNotExited)
    .sort(compareActivitiesByEventDate)[0];
}

export function findTargetActivityIndices(
  activities: Activity[],
  event: DomainEvent,
  context: {
    now: number;
    transitionDuration: number;
  },
): number[] {
  const targetActivities: number[] = [];

  switch (event.name) {
    case "Replaced": {
      const alreadyExistingActivityIndex = last(
        findIndices(activities, (activity) => activity.id === event.activityId),
      );

      if (alreadyExistingActivityIndex !== undefined) {
        break;
      }

      const sorted = activities
        .slice()
        .sort(compareActivitiesByEventDate)
        .filter(isActivityNotExited);

      const isTransitionDone =
        context.now - event.eventDate >= context.transitionDuration;

      const transitionState: ActivityTransitionState =
        event.skipEnterActiveState || isTransitionDone
          ? "enter-done"
          : "enter-active";

      if (transitionState === "enter-done") {
        const range = sorted.findIndex(
          (activity) =>
            !(
              event.skipEnterActiveState &&
              activity.enteredBy.name === "Replaced" &&
              activity.transitionState === "enter-active"
            ),
        );

        return sorted.slice(0, range + 1).map((a) => activities.indexOf(a));
      }
      break;
    }
    case "Popped": {
      const sorted = activities
        .filter(isActivityNotExited)
        .sort(compareActivitiesByEventDate);

      const latestActivity = sorted.slice(0, sorted.length - 1)[0];

      if (latestActivity) {
        targetActivities.push(activities.indexOf(latestActivity));
      }
      break;
    }
    case "StepPushed":
    case "StepReplaced": {
      let targetActivity: Activity | undefined;

      if (event.targetActivityId) {
        targetActivity = activities.find(
          (activity) => activity.id === event.targetActivityId,
        );
      } else {
        targetActivity = findLatestActiveActivity(activities);
      }

      if (targetActivity) {
        targetActivities.push(activities.indexOf(targetActivity));
      }
      break;
    }
    case "StepPopped": {
      let targetActivity: Activity | undefined;

      if (event.targetActivityId) {
        targetActivity = activities.find(
          (activity) => activity.id === event.targetActivityId,
        );
      } else {
        targetActivity = findLatestActiveActivity(activities);
      }

      if (targetActivity && targetActivity.steps.length > 1) {
        targetActivities.push(activities.indexOf(targetActivity));
      }

      break;
    }
    default:
      break;
  }
  return targetActivities;
}
