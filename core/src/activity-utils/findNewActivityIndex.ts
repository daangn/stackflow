import type { PushedEvent, ReplacedEvent } from "../event-types";
import type { Activity } from "../Stack";
import { findIndices, last } from "../utils";

export default function findNewActivityIndex(
  event: PushedEvent | ReplacedEvent,
  activities: Activity[],
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
