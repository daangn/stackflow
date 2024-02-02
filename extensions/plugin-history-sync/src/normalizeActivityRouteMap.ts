import type { ActivityRoute } from "./ActivityRoute";
import type { ActivityRouteMapInput } from "./ActivityRouteMapInput";
import { normalizeRouteInput } from "./normalizeRouteInput";

export function normalizeActivityRouteMap<T extends ActivityRouteMapInput>(
  activityRouteMap: T,
): ActivityRoute[] {
  const routes = Object.keys(activityRouteMap).flatMap((activityName) => {
    const routeInput = activityRouteMap[activityName];

    if (!routeInput) {
      return [];
    }

    return normalizeRouteInput(routeInput).map((path) => ({
      activityName,
      path,
    }));
  });

  return routes;
}
