import type { ActivityRoute } from "./ActivityRoute";
import type { ActivityRouteMapInput } from "./ActivityRouteMapInput";
import { normalizeRouteInput } from "./normalizeRouteInput";

export function normalizeActivityRouteMap<
  K,
  T extends ActivityRouteMapInput<K>,
>(
  activityRouteMap: T,
  type: "url-pattern" | "uri-template",
): ActivityRoute<K>[] {
  return Object.keys(activityRouteMap).flatMap((activityName) => {
    const routeInput = activityRouteMap[activityName];

    if (!routeInput) {
      return [];
    }

    return normalizeRouteInput(routeInput).map((route) => ({
      activityName,
      type,
      ...route,
    }));
  });
}
