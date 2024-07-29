import type { ActivityBaseParams } from "./ActivityBaseParams";

export type ActivityLoaderArgs<Params extends ActivityBaseParams> = {
  params: Params;
};

export type ActivityLoader<Params extends ActivityBaseParams> = (
  args: ActivityLoaderArgs<Params>,
) => any | Promise<any>;
