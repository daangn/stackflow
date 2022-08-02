import { ActivityComponentType, useInitContext } from "@stackflow/react";
import { BaseActivities } from "@stackflow/react/dist/BaseActivities";
import { useMemo } from "react";

import { useLoaders } from "./LoadersContext";

type Preload<T extends BaseActivities> = <K extends Extract<keyof T, string>>(
  activityName: K,
  activityParams: T[K] extends ActivityComponentType<infer U> ? U : {},
  options?: {
    eventContext?: any;
  },
) => any;

export function usePreloader<T extends BaseActivities>(): {
  preload: Preload<T>;
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
