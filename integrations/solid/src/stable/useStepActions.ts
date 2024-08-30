import type { Accessor } from "solid-js";

import type { ActivityComponentType } from "../__internal__/ActivityComponentType";
import { makeStepId } from "../__internal__/activity";
import { useCoreActions, useCoreState } from "../__internal__/core";
import type { BaseActivities } from "./BaseActivities";

export type UseStepActionsOutputType<P> = {
  pending: Accessor<boolean>;
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
  const { pending } = useCoreState();

  return {
    pending,
    stepPush(
      params,
      options?: {
        targetActivityId?: string;
      },
    ) {
      const stepId = makeStepId();

      coreActions().stepPush({
        stepId,
        stepParams: params,
        targetActivityId: options?.targetActivityId,
      });
    },
    stepReplace(
      params,
      options?: {
        targetActivityId?: string;
      },
    ) {
      const stepId = makeStepId();

      coreActions().stepReplace({
        stepId,
        stepParams: params,
        targetActivityId: options?.targetActivityId,
      });
    },
    stepPop(options?: {
      targetActivityId?: string;
    }) {
      coreActions().stepPop({
        targetActivityId: options?.targetActivityId,
      });
    },
  };
};
