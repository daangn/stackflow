import type { BaseParams } from "./BaseParams";

export type ActivityDefinition<
  Name extends string,
  Params extends BaseParams,
> = {
  name: Name;
  path: string;
  paramTypes?: Params;
  loader?: (args: { params: Partial<Params>; context: any }) =>
    | any
    | Promise<any>;
};
