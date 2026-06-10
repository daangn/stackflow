import type { Activity, Stack } from "@stackflow/core";
import type { ActivityRoute } from "./ActivityRoute";
import type { State } from "./historyState";
import type { UrlPatternOptions } from "./makeTemplate";
import { makeTemplate } from "./makeTemplate";

/**
 * One browser history entry the current stack expects to exist. The desired
 * entry list is the render target the reconciler converges the actual browser
 * history onto.
 */
export interface DesiredHistoryEntry {
  activityId: string;
  stepId: string;
  path: string;

  /**
   * The state to serialize into the browser entry (without `entryIndex`,
   * which is assigned by the reconciler when the entry is written).
   */
  state: State;
}

function isEntered(activity: Activity): boolean {
  return (
    activity.transitionState === "enter-active" ||
    activity.transitionState === "enter-done"
  );
}

/**
 * Computes the desired browser history entries from the current stack: one
 * entry per live step of every entered activity (an activity's first live
 * step is the activity's own entry and is serialized without a `step` field,
 * matching the legacy state shape).
 *
 * Replace special case: while a `Replaced` activity's enter transition is
 * still in flight, the core has not yet marked the activity it replaces as
 * exited (that happens when the transition completes — even if the replacing
 * activity itself gets popped in the meantime). The replaced activity must
 * not occupy a desired entry during that window — otherwise a replace would
 * transiently grow the browser history by one entry and then shrink it back.
 * So for every `Replaced` entry event that displaced a predecessor and whose
 * victim is not marked yet (no activity carries it as `exitedBy`), we drop
 * the closest surviving predecessor, mirroring what the core will do when
 * the transition settles.
 *
 * An *in-place* replace — a `Replaced` event reusing an activityId that
 * already exists in the stack (reachable via the public
 * `replace(name, params, { activityId })` API) — updates that activity's
 * slot and never displaces anything: the core's `findTargetActivityIndices`
 * skips victim marking entirely for it. Such events must not drop a
 * predecessor (the victim would never be marked, so the drop would otherwise
 * apply forever). They are detected through the event log: a prior entry
 * event with the same activityId means the slot already existed.
 *
 * Ordering note: this module orders activities by `enteredBy.eventDate`
 * (navigation time), while the core's `isActive`/render order follows the
 * `activities` array slot order. The two agree for every navigation this
 * plugin itself dispatches (forward restorations only re-enter entries above
 * the current position, whose slots are also on top). User code that
 * re-enters a historical slot behind the active one by passing an explicit
 * old `activityId` to `push` — or that in-place-replaces an *inactive*
 * activity via `replace(..., { activityId })`, which refreshes its
 * `enteredBy.eventDate` and reorders it to the end of the desired list — can
 * make them diverge; both are outside this plugin's contract.
 */
export function computeDesiredHistoryEntries({
  stack,
  activityRoutes,
  urlPatternOptions,
}: {
  stack: Stack;
  activityRoutes: ActivityRoute<unknown>[];
  urlPatternOptions?: UrlPatternOptions;
}): DesiredHistoryEntry[] {
  const activitiesInNavigationOrder = stack.activities
    .slice()
    .sort((a, b) => a.enteredBy.eventDate - b.enteredBy.eventDate);

  const surviving: Activity[] = [];

  for (const activity of activitiesInNavigationOrder) {
    if (activity.enteredBy.name === "Replaced" && surviving.length > 0) {
      const enteredBy = activity.enteredBy;

      const reusedExistingActivity = stack.events.some(
        (event) =>
          (event.name === "Pushed" || event.name === "Replaced") &&
          event.id !== enteredBy.id &&
          event.activityId === enteredBy.activityId &&
          event.eventDate <= enteredBy.eventDate,
      );
      const victimAlreadyMarked = stack.activities.some(
        (candidate) => candidate.exitedBy?.id === enteredBy.id,
      );

      if (!reusedExistingActivity && !victimAlreadyMarked) {
        surviving.pop();
      }
    }

    if (isEntered(activity)) {
      surviving.push(activity);
    }
  }

  const entries: DesiredHistoryEntry[] = [];

  for (const activity of surviving) {
    const activityRoute = activityRoutes.find(
      (route) => route.activityName === activity.name,
    );

    if (!activityRoute) {
      continue;
    }

    const template = makeTemplate(activityRoute, urlPatternOptions);
    const liveSteps = activity.steps.filter((step) => !step.exitedBy);

    liveSteps.forEach((step, stepIndex) => {
      entries.push({
        activityId: activity.id,
        stepId: step.id,
        path: template.fill(step.params),
        state:
          stepIndex === 0
            ? {
                activity,
              }
            : {
                activity,
                step,
              },
      });
    });
  }

  return entries;
}
