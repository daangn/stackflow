import { useMemo } from "react";

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
    params: P,
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

  return useMemo(
    () => ({
      pending,
      stepPush(params, options) {
        const targetActivityId = options?.targetActivityId ?? id;
        const targetActivity = coreActions
          ?.getStack()
          .activities.find(({ id }) => id === targetActivityId);

        if (!targetActivity)
          throw new Error("Cannot push step. Target activity not found.");

        const previousParams = targetActivity.params as P;
        const nextParams =
          typeof params === "function" ? params(previousParams) : params;
        const stepId = makeStepId();

        coreActions?.stepPush({
          stepId,
          stepParams: nextParams,
          targetActivityId: options?.targetActivityId,
        });
      },
      stepReplace(params, options) {
        const stepId = makeStepId();

        coreActions?.stepReplace({
          stepId,
          stepParams: params,
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
