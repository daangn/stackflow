import { ActivityComponentType, useInitContext } from "@stackflow/react";
import { useMemo } from "react";

import { useLoaders } from "./LoadersContext";

type PreloadFunc<T extends { [activityName: string]: ActivityComponentType }> =
  <K extends Extract<keyof T, string>>(
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
  const initContext = useInitContext();

  return useMemo(
    () => ({
      preload(activityName, activityParams, options) {
        const loader = loaders[activityName];

        if (!loader) {
          return null;
        }

        return loader({
          activityParams,
          eventContext: options?.eventContext,
          initContext,
        });
      },
    }),
    [loaders, initContext],
  );
}
