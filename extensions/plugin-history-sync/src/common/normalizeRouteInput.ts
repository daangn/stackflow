import type { Route, RouteLike } from "./RouteLike";

function makeRoute<T>(path: string | Route<T>): Route<T> {
  return typeof path === "string" ? { path } : path;
}

export function normalizeRouteInput<T>(route: RouteLike<T>): Route<T>[] {
  return (Array.isArray(route) ? route : [route]).map(makeRoute);
}
