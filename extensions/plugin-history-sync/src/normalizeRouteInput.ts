export function normalizeRouteInput(route: string | string[]) {
  return typeof route === "string" ? [route] : route;
}
