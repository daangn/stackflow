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

      const cloned = activities.slice();
      cloned.sort((a1, a2) => a2.enteredBy.eventDate - a1.enteredBy.eventDate);
      for (let i = 0; i < cloned.length; i += 1) {
        targetActivities.push(i);
        if (cloned[i].enteredBy.name === "Pushed") {
          break;
        }
      }
      break;
    }
    case "Popped":
    case "StepPushed":
    case "StepReplaced":
    case "StepPopped": {
      let targetIdx = 0;
      let { eventDate } = activities[0].enteredBy;

      for (let i = 1; i < activities.length; i += 1) {
        if (activities[i].enteredBy.eventDate > eventDate) {
          targetIdx = i;
          eventDate = activities[i].enteredBy.eventDate;
        }
      }

      if (event.name !== "Popped" || targetIdx !== 0) {
        targetActivities.push(targetIdx);
      }
      break;
    }
    default:
      break;
  }
  return targetActivities;
}
