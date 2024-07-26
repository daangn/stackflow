export type ActivityLoader<T extends {}> = (args: {
  params: T;
}) => any | Promise<any>;
