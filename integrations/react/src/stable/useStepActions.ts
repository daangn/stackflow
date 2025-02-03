import { useMemo } from "react";

import type { ActivityComponentType } from "../__internal__/ActivityComponentType";
import { makeStepId } from "../__internal__/activity";
import { useCoreActions } from "../__internal__/core";
import { useTransition } from "../__internal__/shims";
import type { BaseActivities } from "./BaseActivities";

export type UseStepActionsOutputType<P> = {
  pending: boolean;
  stepPush: (
    params: P,
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
  const [pending] = useTransition();

  return useMemo(
    () => ({
      pending,
      stepPush(params, options) {
        const stepId = makeStepId();

        coreActions?.stepPush({
          stepId,
          stepParams: params,
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
    ],
  );
};
