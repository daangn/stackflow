import type { UrlPatternOptions } from "@stackflow/plugin-history-sync";
import { makeTemplate, useRoutes } from "@stackflow/plugin-history-sync";
import type { ActivityComponentType } from "@stackflow/react";
import { useMemo } from "react";

import { useLoaders } from "./LoadersContext";

export type PreloadFunc<T extends { [activityName: string]: unknown }> = <
  K extends Extract<keyof T, string>,
>(
  activityName: K,
  activityParams: T[K] extends ActivityComponentType<infer U> ? U : {},
  options?: {
    activityContext?: {};
  },
) => any;

export type UsePreloaderOptions = {
  urlPatternOptions?: UrlPatternOptions;
};

export function usePreloader<T extends { [activityName: string]: unknown }>(
  usePreloaderOptions?: UsePreloaderOptions,
): {
  preload: PreloadFunc<T>;
} {
  const loaders = useLoaders();
  const routes = useRoutes();

  return useMemo(
    () => ({
      preload(activityName, activityParams, options) {
        const loader = loaders[activityName];

        if (!loader) {
          return null;
        }

        const match = routes.find((r) => r.activityName === activityName);

        const template = match
          ? makeTemplate(match.path, usePreloaderOptions?.urlPatternOptions)
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
    }),
    [loaders],
  );
}
