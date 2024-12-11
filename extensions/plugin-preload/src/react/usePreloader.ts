import type { UrlPatternOptions } from "@stackflow/plugin-history-sync/react";
import { makeTemplate, useRoutes } from "@stackflow/plugin-history-sync/react";
import { useMemo } from "react";

import { type Preloader, makePreloader } from "../common/makePreloader";
import { useLoaders } from "./LoadersContext";

export type UsePreloaderOptions = {
  urlPatternOptions?: UrlPatternOptions;
};

export function usePreloader<T extends { [activityName: string]: unknown }>(
  usePreloaderOptions?: UsePreloaderOptions,
): Preloader<T> {
  const loaders = useLoaders();
  const routes = useRoutes();

  return useMemo(
    () =>
      makePreloader({
        loaders,
        routes,
        makeTemplate,
        urlPatternOptions: usePreloaderOptions?.urlPatternOptions,
      }),
    [loaders],
  );
}
