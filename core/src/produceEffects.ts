import isEqual from "react-fast-compare";

import { AggregateOutput } from "./AggregateOutput";
import { Effect } from "./Effect";

export function produceEffects(
  prevOutput: AggregateOutput,
  nextOutput: AggregateOutput,
): Effect[] {
  const output: Effect[] = [];

  if (!isEqual(prevOutput, nextOutput)) {
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

    if (!prevActivity && !!nextActivity) {
      output.push({
        _TAG: nextActivity.pushedBy.name === "Pushed" ? "PUSHED" : "REPLACED",
        activity: nextActivity,
      });
    }

    const isPrevActivityPopped =
      prevActivity?.transitionState === "exit-done" ||
      prevActivity?.transitionState === "exit-active";
    const isNextActivityPushed =
      nextActivity?.transitionState === "enter-active" ||
      nextActivity?.transitionState === "enter-done";

    if (isPrevActivityPopped && isNextActivityPushed) {
      output.push({
        _TAG: nextActivity.pushedBy.name === "Pushed" ? "PUSHED" : "REPLACED",
        activity: nextActivity,
      });
    }

    const isPrevActivityPopped =
      prevActivity?.transitionState === "exit-done" ||
      prevActivity?.transitionState === "exit-active";
    const isNextActivityPushed =
      nextActivity?.transitionState === "enter-active" ||
      nextActivity?.transitionState === "enter-done";

    if (isPrevActivityPopped && isNextActivityPushed) {
      output.push({
        _TAG: "PUSHED",
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
