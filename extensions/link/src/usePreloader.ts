import {
  makeTemplate,
  normalizeRoute,
  useRoutes,
} from "@stackflow/plugin-history-sync";
import { useLoaders } from "@stackflow/plugin-preload";
import type { ActivityComponentType } from "@stackflow/react";
import { useInitContext } from "@stackflow/react";
import { useMemo } from "react";

export type PreloadFunc<
  T extends { [activityName: string]: ActivityComponentType },
> = <K extends Extract<keyof T, string>>(
  activityName: K,
  activityParams: T[K] extends ActivityComponentType<infer U> ? U : {},
  options?: {
    eventContext?: any;
  },
) => any;

export function usePreloader<
  T extends { [activityName: string]: ActivityComponentType },
>(): {
  preload: PreloadFunc<T>;
} {
  const loaders = useLoaders();
  const routes = useRoutes();
  const initContext = useInitContext();

  return useMemo(
    () => ({
      preload(activityName, activityParams, options) {
        const loader = loaders[activityName];
        const route = routes[activityName];

        if (!loader || !route) {
          return null;
        }

        const template = makeTemplate(normalizeRoute(route)[0]);
        const path = template.fill(activityParams);

        return loader({
          activityParams,
          eventContext: {
            path,
            ...options?.eventContext,
          },
          initContext,
        });
      },
    }),
    [loaders, initContext],
  );
}
