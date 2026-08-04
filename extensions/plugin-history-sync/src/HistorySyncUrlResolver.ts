import type { History } from "history";

import type { ActivityRoute } from "./ActivityRoute";
import { makeTemplate, type UrlPatternOptions } from "./makeTemplate";

export interface HistorySyncUrlResolver {
  readonly makeActivityUrl: (
    activityName: string,
    activityParams: Record<string, any>,
  ) => string;
  readonly resolveEntryUrl: (initialContext: any) => string;
}

export function createHistorySyncUrlResolver({
  activityRoutes,
  location,
  useHash,
  urlPatternOptions,
}: {
  activityRoutes: ActivityRoute<unknown>[];
  location: History["location"];
  useHash?: boolean;
  urlPatternOptions?: UrlPatternOptions;
}): HistorySyncUrlResolver {
  const entryLocation = {
    hash: location.hash,
    pathname: location.pathname,
    search: location.search,
  };

  return Object.freeze({
    makeActivityUrl(
      activityName: string,
      activityParams: Record<string, any>,
    ) {
      const route = activityRoutes.find(
        (activityRoute) => activityRoute.activityName === activityName,
      );

      if (!route) {
        throw new Error(`Cannot find a route for activity ${activityName}`);
      }

      return makeTemplate(route, urlPatternOptions).fill(activityParams);
    },

    resolveEntryUrl(initialContext: any) {
      if (
        initialContext?.req?.path &&
        typeof initialContext.req.path === "string"
      ) {
        return initialContext.req.path;
      }

      if (useHash) {
        return entryLocation.hash.split("#")[1] ?? "/";
      }

      return entryLocation.pathname + entryLocation.search;
    },
  });
}
