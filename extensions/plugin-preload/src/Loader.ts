export type Loader<P = {}> = (args: {
  activityParams: P;
  eventContext: any;
  initContext: any;
  isInitialActivity?: boolean;
}) => any;
