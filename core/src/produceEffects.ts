import isEqual from "react-fast-compare";

import type { Effect } from "./Effect";
import type { Stack } from "./Stack";
import { omit } from "./utils";

export function produceEffects(prevOutput: Stack, nextOutput: Stack): Effect[] {
  const output: Effect[] = [];

  const somethingChanged = !isEqual(prevOutput, nextOutput);

  if (somethingChanged) {
    output.push({
      _TAG: "%SOMETHING_CHANGED%",
    });
  }

  const isPaused =
    prevOutput.globalTransitionState !== "paused" &&
    nextOutput.globalTransitionState === "paused";
  const isResumed =
    prevOutput.globalTransitionState === "paused" &&
    nextOutput.globalTransitionState !== "paused";

  if (isPaused) {
    output.push({
      _TAG: "PAUSED",
    });
  }
  if (isResumed) {
    output.push({
      _TAG: "RESUMED",
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

    if (prevActivity && nextActivity && prevActivity.id === nextActivity.id) {
      for (
        let j = 0;
        j <
        Math.max(
          (prevActivity.steps ?? []).length,
          (nextActivity.steps ?? []).length,
        );
        j += 1
      ) {
        const prevStep = prevActivity.steps[j];
        const nextStep = nextActivity.steps[j];

        if (!prevStep && nextStep) {
          output.push({
            _TAG: "STEP_PUSHED",
            activity: nextActivity,
            step: nextStep,
          });
        } else if (prevStep && !nextStep) {
          output.push({
            _TAG: "STEP_POPPED",
            activity: nextActivity,
          });
        } else if (
          prevActivity.steps.length === nextActivity.steps.length &&
          prevStep.id !== nextStep.id
        ) {
          output.push({
            _TAG: "STEP_REPLACED",
            activity: nextActivity,
            step: nextStep,
          });
        }
      }
    }

    if (!prevActivity && nextActivity) {
      output.push({
        _TAG: nextActivity.enteredBy.name === "Pushed" ? "PUSHED" : "REPLACED",
        activity: nextActivity,
      });
    } else if (isPrevActivityPopped && isNextActivityPushed) {
      output.push({
        _TAG: nextActivity.enteredBy.name === "Pushed" ? "PUSHED" : "REPLACED",
        activity: nextActivity,
      });
    } else if (
      prevActivity &&
      nextActivity &&
      prevActivity.id === nextActivity.id &&
      !isEqual(
        omit(prevActivity, [
          "isActive",
          "isTop",
          "isRoot",
          "transitionState",
          "zIndex",
        ]),
        omit(nextActivity, [
          "isActive",
          "isTop",
          "isRoot",
          "transitionState",
          "zIndex",
        ]),
      ) &&
      nextActivity.enteredBy.name === "Replaced" &&
      !isEqual(prevActivity.enteredBy, nextActivity.enteredBy)
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
    const isPrevActivityPushed =
      prevOutput.activities[j]?.transitionState === "enter-done" ||
      prevOutput.activities[j]?.transitionState === "enter-active";
    const isNextActivityPopped =
      nextOutput.activities[j]?.transitionState === "exit-active" ||
      nextOutput.activities[j]?.transitionState === "exit-done";
    const isReplacedEvent =
      nextOutput.activities[j + 1]?.enteredBy.name === "Replaced" &&
      nextOutput.activities[j + 1]?.transitionState === "enter-done";

    if (isPrevActivityPushed && isNextActivityPopped && !isReplacedEvent) {
      output.push({
        _TAG: "POPPED",
        activity: nextOutput.activities[j],
      });
    }
  }

  return output;
}
