export type StepActions<ActivityParams> = {
  pushStep: (
    params: ActivityParams | ((prevParams: ActivityParams) => ActivityParams),
    options?: {
      targetActivityId?: string;
      hasZIndex?: boolean;
    },
  ) => void;
  replaceStep: (
    params: ActivityParams | ((prevParams: ActivityParams) => ActivityParams),
    options?: {
      targetActivityId?: string;
      hasZIndex?: boolean;
    },
  ) => void;
  popStep: (options?: { targetActivityId?: string }) => void;
};
