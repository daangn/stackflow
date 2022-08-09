export type Loader<P extends { [key in keyof P]: string | undefined } = {}> =
  (args: {
    activityParams: P;
    activityContext: unknown;
    initContext: unknown;
    isInitialActivity?: boolean;
  }) => unknown;
