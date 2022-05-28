import {
  Activity,
  ActivityTransitionState,
  AggregateOutput,
} from "./AggregateOutput";
import { Event } from "./events";
import { filterEvents } from "./filterEvents";
import { validateEvents } from "./validateEvents";

export function aggregate(events: Event[], now: number): AggregateOutput {
  validateEvents(events);

  const initEvent = filterEvents(events, "Initialized")[0];
  const activityRegisteredEvents = filterEvents(events, "ActivityRegistered");
  const pushedEvents = filterEvents(events, "Pushed");

  const registeredActivityNames = activityRegisteredEvents.map(
    (e) => e.activityName,
  );

  const activities: Array<Activity> = [
    ...pushedEvents
      .filter((e) => registeredActivityNames.includes(e.activityName))
      .map((e) => {
        const transitionState: ActivityTransitionState =
          now - e.eventDate >= initEvent.transitionDuration
            ? "enter-done"
            : "enter-active";

        return {
          activityId: e.activityId,
          activityName: e.activityName,
          transition: {
            state: transitionState,
          },
        };
      }),
  ];

  const globalTransitionState = activities.find(
    (a) =>
      a.transition.state === "enter-active" ||
      a.transition.state === "exit-active",
  )
    ? "loading"
    : "idle";

  return {
    activities,
    transition: {
      state: globalTransitionState,
    },
  };
}
