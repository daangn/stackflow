import type {
  UrlPatternOptions,
  makeTemplate,
} from "@stackflow/plugin-history-sync";

import type { LoadersMap } from "./Loader";
import type { ActivityParams } from "./activityComponentType";

export type PreloadFunc<T extends { [activityName: string]: unknown }> = <
  K extends Extract<keyof T, string>,
>(
  activityName: K,
  activityParams: ActivityParams<T[K]>,
  options?: {
    activityContext?: {};
  },
) => any;
export type Preloader<T extends { [activityName: string]: unknown }> = {
  preload: PreloadFunc<T>;
};

type MakeTemplate = typeof makeTemplate;

export const makePreloader = <
  T extends { [activityName: string]: unknown },
>(args: {
  loaders: LoadersMap;
  routes: { activityName: string }[];
  makeTemplate: MakeTemplate;
  urlPatternOptions?: UrlPatternOptions;
}): Preloader<T> => ({
  preload(activityName, activityParams, options) {
    const loader = args.loaders[activityName];

    if (!loader) {
      return null;
    }

    const match = args.routes.find((r) => r.activityName === activityName);

    const template = match
      ? args.makeTemplate(
          match as unknown as Parameters<MakeTemplate>[0],
          args?.urlPatternOptions,
        )
      : undefined;

    const path = template?.fill(activityParams);

    return loader({
      activityParams,
      activityContext: {
        ...(path ? { path } : null),
        ...options?.activityContext,
      },
    });
  },
});
