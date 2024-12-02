export type StepActions<ActivityParams> = {
  pushStep: (
    params: ActivityParams,
    options?: {
      targetActivityId?: string;
    },
  ) => void;
  replaceStep: (
    params: ActivityParams,
    options?: {
      targetActivityId?: string;
    },
  ) => void;
  popStep: (options?: { targetActivityId?: string }) => void;
};
