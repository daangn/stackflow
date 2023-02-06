import { useMemo } from "react";

import type { ActivityComponentType } from "./activity";
import { makeStepId } from "./activity";
import type { BaseActivities } from "./BaseActivities";
import { useCoreActions } from "./core";
import { useTransition } from "./shims";

export type UseStepActionsOutputType<P> = {
  pending: boolean;
  stepPush: (params: P, options?: {}) => void;
  stepReplace: (params: P, options?: {}) => void;
  stepPop: (options?: {}) => void;
};

export type UseStepActions<T extends BaseActivities = {}> = <
  K extends Extract<keyof T, string>,
>(
  activityName: K,
) => UseStepActionsOutputType<
  T[K] extends
    | ActivityComponentType<infer U>
    | { component: ActivityComponentType<infer U> }
    ? U
    : {}
>;

export const useStepActions: UseStepActions = () => {
  const coreActions = useCoreActions();
  const [pending] = useTransition();

  return useMemo(
    () => ({
      pending,
      stepPush(params) {
        const stepId = makeStepId();

        coreActions?.stepPush({
          stepId,
          stepParams: params,
        });
      },
      stepReplace(params) {
        const stepId = makeStepId();

        coreActions?.stepReplace({
          stepId,
          stepParams: params,
        });
      },
      stepPop() {
        coreActions?.stepPop({});
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
