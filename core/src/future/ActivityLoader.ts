import type { BaseParams } from "./BaseParams";

export type ActivityLoader<T extends BaseParams> = (args: {
  params: Partial<T>;
}) => any | Promise<any>;
