export function normalizeRoute(route: string | string[]) {
  return typeof route === "string" ? [route] : route;
}
