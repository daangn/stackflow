export type Loader<P extends { [key in keyof P]: string | undefined } = {}> =
  (args: {
    activityParams: P;
    eventContext: any;
    initContext: any;
    isInitialActivity?: boolean;
  }) => any;
