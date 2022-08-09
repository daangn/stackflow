export type Loader<P extends { [key in keyof P]: string | undefined } = {}> =
  (args: {
    activityParams: P;
    eventContext: unknown;
    initContext: unknown;
    isInitialActivity?: boolean;
  }) => unknown;
