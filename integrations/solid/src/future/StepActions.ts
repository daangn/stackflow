export type StepActions<ActivityParams> = {
  pushStep: (params: ActivityParams, options?: {}) => void;
  replaceStep: (params: ActivityParams, options?: {}) => void;
  popStep: (options?: {}) => void;
};
