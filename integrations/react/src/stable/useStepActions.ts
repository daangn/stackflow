import { useCallback, useMemo } from "react";

import { makeStepId, useActivity } from "../__internal__/activity";
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
  const { id } = useActivity();
  const [pending] = useTransition();
  const resolveNextParams = useCallback(
    (activityId: string, params: P | ((previousParams: P) => P)) => {
      const targetActivity = coreActions
        ?.getStack()
        .activities.find(({ id }) => id === activityId);

      if (!targetActivity) throw new Error("The target activity is not found.");

      const previousParams = targetActivity.params as P;

      return typeof params === "function" ? params(previousParams) : params;
    },
    [coreActions],
  );

  return useMemo(
    () => ({
      pending,
      stepPush(params, options) {
        const targetActivityId = options?.targetActivityId ?? id;
        const nextParams = resolveNextParams(targetActivityId, params);
        const stepId = makeStepId();

        coreActions?.stepPush({
          stepId,
          stepParams: nextParams,
          targetActivityId: options?.targetActivityId,
        });
      },
      stepReplace(params, options) {
        const targetActivityId = options?.targetActivityId ?? id;
        const nextParams = resolveNextParams(targetActivityId, params);
        const stepId = makeStepId();

        coreActions?.stepReplace({
          stepId,
          stepParams: nextParams,
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
      pending,
      id,
    ],
  );
};
