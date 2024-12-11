export type Loader<P extends { [key in keyof P]: string | undefined } = {}> =
  (args: {
    activityParams: P;
    activityContext: unknown;
    isInitialActivity?: boolean;
    initialContext?: any;
  }) => unknown;

export type LoadersMap = {
  [activityName in string]?: Loader;
};
