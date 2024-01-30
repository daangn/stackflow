export type ActivityComponentType<
  T extends Record<keyof T, string | undefined> = {},
> = React.ComponentType<{ params: T }>;
