import type { DomainEvent } from "../event-types";
import type { Activity } from "../Stack";
import { findIndices, last } from "../utils";

export default function findTargetActivityIndexes(
  activities: Activity[],
  event: DomainEvent,
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
        .sort((a1, a2) => a2.enteredBy.eventDate - a1.enteredBy.eventDate);

      for (const activity of sorted) {
        // push original index
        targetActivities.push(activities.indexOf(activity));

        if (activity.enteredBy.name === "Pushed") {
          break;
        }
      }
      break;
    }
    case "Popped": {
      const latestActivity = activities
        .slice(1)
        .filter((activity) => !activity.exitedBy)
        .sort((a1, a2) => a2.enteredBy.eventDate - a1.enteredBy.eventDate)[0];

      if (latestActivity) {
        targetActivities.push(activities.indexOf(latestActivity));
      }
      break;
    }
    case "StepPushed":
    case "StepReplaced": {
      const latestActivity = activities
        .filter((activity) => !activity.exitedBy)
        .sort((a1, a2) => a2.enteredBy.eventDate - a1.enteredBy.eventDate)[0];

      if (latestActivity) {
        targetActivities.push(activities.indexOf(latestActivity));
      }
      break;
    }
    case "StepPopped": {
      const latestActivity = activities
        .filter((activity) => !activity.exitedBy)
        .sort((a1, a2) => a2.enteredBy.eventDate - a1.enteredBy.eventDate)[0];

      if (latestActivity && latestActivity.steps.length > 1) {
        targetActivities.push(activities.indexOf(latestActivity));
      }

      break;
    }
    default:
      break;
  }
  return targetActivities;
}
