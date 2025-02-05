export type StepActions<ActivityParams> = {
  pushStep: (
    params: ActivityParams | ((prevParams: ActivityParams) => ActivityParams),
    options?: {
      targetActivityId?: string;
    },
  ) => void;
  replaceStep: (
    params: ActivityParams | ((prevParams: ActivityParams) => ActivityParams),
    options?: {
      targetActivityId?: string;
    },
  ) => void;
  popStep: (options?: { targetActivityId?: string }) => void;
};
