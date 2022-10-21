import isEqual from "react-fast-compare";

import type { AggregateOutput } from "./AggregateOutput";
import type { Effect } from "./Effect";
import { omit } from "./utils";

export function produceEffects(
  prevOutput: AggregateOutput,
  nextOutput: AggregateOutput,
): Effect[] {
  const output: Effect[] = [];

  const somethingChanged = !isEqual(prevOutput, nextOutput);

  if (somethingChanged) {
    output.push({
      _TAG: "%SOMETHING_CHANGED%",
    });
  }

  for (
    let i = 0;
    i < Math.max(prevOutput.activities.length, nextOutput.activities.length);
    i += 1
  ) {
    const prevActivity = prevOutput.activities[i];
    const nextActivity = nextOutput.activities[i];

    const isPrevActivityPopped =
      prevActivity?.transitionState === "exit-done" ||
      prevActivity?.transitionState === "exit-active";
    const isNextActivityPushed =
      nextActivity?.transitionState === "enter-active" ||
      nextActivity?.transitionState === "enter-done";

    if (!prevActivity && nextActivity) {
      output.push({
        _TAG: nextActivity.pushedBy.name === "Pushed" ? "PUSHED" : "REPLACED",
        activity: nextActivity,
      });
    } else if (isPrevActivityPopped && isNextActivityPushed) {
      output.push({
        _TAG: nextActivity.pushedBy.name === "Pushed" ? "PUSHED" : "REPLACED",
        activity: nextActivity,
      });
    } else if (
      !!prevActivity &&
      !!nextActivity &&
      prevActivity.id === nextActivity.id &&
      !isEqual(
        omit(prevActivity, ["isActive", "isTop", "transitionState", "zIndex"]),
        omit(nextActivity, ["isActive", "isTop", "transitionState", "zIndex"]),
      )
    ) {
      output.push({
        _TAG: "REPLACED",
        activity: nextActivity,
      });
    }
  }

  for (
    let j =
      Math.max(prevOutput.activities.length, nextOutput.activities.length) - 1;
    j >= 0;
    j -= 1
  ) {
    const prevActivity = prevOutput.activities[j];
    const nextActivity = nextOutput.activities[j];

    const isPrevActivityPushed =
      prevActivity?.transitionState === "enter-done" ||
      prevActivity?.transitionState === "enter-active";
    const isNextActivityPopped =
      nextActivity?.transitionState === "exit-active" ||
      nextActivity?.transitionState === "exit-done";

    if (isPrevActivityPushed && isNextActivityPopped) {
      output.push({
        _TAG: "POPPED",
        activity: nextActivity,
      });
    }
  }

  return output;
}
