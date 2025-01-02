import type { Activity } from "../Stack";
import type { PushedEvent, ReplacedEvent } from "../event-types";
import { findIndices, last } from "../utils";

export function findNewActivityIndex(
  activities: Activity[],
  event: PushedEvent | ReplacedEvent,
) {
  switch (event.name) {
    case "Pushed":
      return activities.length;
    case "Replaced": {
      const alreadyExistingActivityIndex = last(
        findIndices(activities, (activity) => activity.id === event.activityId),
      );
      return alreadyExistingActivityIndex ?? activities.length;
    }
    default:
      return -1;
  }
}
