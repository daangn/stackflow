import type { RouteLike } from "./RouteLike";

export type ActivityRouteMapInput<T> = {
  [activityName in string]?: RouteLike<T>;
};
