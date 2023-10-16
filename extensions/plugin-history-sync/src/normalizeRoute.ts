import type { Route } from "./RoutesContext";

function makeRoute<T>(path: string | Route<T>): Route<T> {
  return typeof path === "string" ? { path } : path;
}

export function normalizeRoute<T>(
  route: string | string[] | Route<T> | Route<T>[],
): Route<T>[] {
  return (Array.isArray(route) ? route : [route]).map(makeRoute);
}
