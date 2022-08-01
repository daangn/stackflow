import { ActivityComponentType, useInitContext } from "@stackflow/react";
import { BaseActivities } from "@stackflow/react/dist/BaseActivities";
import { useCallback, useMemo } from "react";

import { useLoaders } from "./LoadersContext";

export function usePreloader<T extends BaseActivities>() {
  const loaders = useLoaders();
  const initContext = useInitContext();

  const preload = useCallback(
    <K extends Extract<keyof T, string>>(
      activityName: K,
      activityParams: T[K] extends ActivityComponentType<infer U> ? U : {},
      options?: {
        eventContext?: any;
      },
    ) => {
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
    [],
  );

  return useMemo(() => ({ preload }), [preload]);
}
