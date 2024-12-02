import type { UrlPatternOptions } from "@stackflow/plugin-history-sync/solid";
import { makeTemplate, useRoutes } from "@stackflow/plugin-history-sync/solid";

import { createMemo } from "solid-js";
import { type Preloader, makePreloader } from "../common/makePreloader";
import { useLoaders } from "./LoadersContext.solid";

export type UsePreloaderOptions = {
  urlPatternOptions?: UrlPatternOptions;
};

export function usePreloader<T extends { [activityName: string]: unknown }>(
  usePreloaderOptions?: UsePreloaderOptions,
): () => Preloader<T> {
  const loaders = useLoaders();
  const routes = useRoutes();

  return createMemo(() =>
    makePreloader({
      loaders: loaders(),
      routes,
      makeTemplate,
      urlPatternOptions: usePreloaderOptions?.urlPatternOptions,
    }),
  );
}
