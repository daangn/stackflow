export type ActivityComponentType<
  T extends { [K in keyof T]: string | undefined } = {},
> = React.ComponentType<{ params: T }>;
