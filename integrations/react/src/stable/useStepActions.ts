import { useMemo } from "react";

import {
  findActivityById,
  findLatestActiveActivity,
  makeStepId,
} from "../__internal__/activity";
import { useCoreActions } from "../__internal__/core";
import { useTransition } from "../__internal__/shims";

export type UseStepActionsOutputType<P> = {
  pending: boolean;
  stepPush: (
    params: P | ((previousParams: P) => P),
    options?: {
      targetActivityId?: string;
    },
  ) => void;
  stepReplace: (
    params: P | ((previousParams: P) => P),
    options?: {
      targetActivityId?: string;
    },
  ) => void;
  stepPop: (options?: { targetActivityId?: string }) => void;
};

export const useStepActions = <
  P extends Record<string, string | undefined>,
>(): UseStepActionsOutputType<P> => {
  const coreActions = useCoreActions();
  const [pending] = useTransition();

  return useMemo(
    () => ({
      pending,
      stepPush(params, options) {
        const activities = coreActions?.getStack().activities;
        const findTargetActivity = options?.targetActivityId
          ? findActivityById(options.targetActivityId)
          : findLatestActiveActivity;
        const targetActivity = activities && findTargetActivity(activities);

        if (!targetActivity)
          throw new Error("The target activity is not found.");

        const stepParams =
          typeof params === "function"
            ? params(targetActivity.params as P)
            : params;
        const stepId = makeStepId();

        coreActions?.stepPush({
          stepId,
          stepParams,
          targetActivityId: options?.targetActivityId,
        });
      },
      stepReplace(params, options) {
        const activities = coreActions?.getStack().activities;
        const findTargetActivity = options?.targetActivityId
          ? findActivityById(options.targetActivityId)
          : findLatestActiveActivity;
        const targetActivity = activities && findTargetActivity(activities);

        if (!targetActivity)
          throw new Error("The target activity is not found.");

        const stepParams =
          typeof params === "function"
            ? params(targetActivity.params as P)
            : params;
        const stepId = makeStepId();

        coreActions?.stepReplace({
          stepId,
          stepParams,
          targetActivityId: options?.targetActivityId,
        });
      },
      stepPop(options) {
        coreActions?.stepPop({
          targetActivityId: options?.targetActivityId,
        });
      },
    }),
    [
      coreActions?.stepPush,
      coreActions?.stepReplace,
      coreActions?.stepPop,
      coreActions?.getStack,
      pending,
    ],
  );
};
