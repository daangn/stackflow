import type { ActivityRoute } from "./ActivityRoute";
import { makeTemplate } from "./makeTemplate";

export function sortActivityRoutes(routes: ActivityRoute[]): ActivityRoute[] {
  return [...routes].sort(
    (a, b) =>
      makeTemplate(a.path).variableCount - makeTemplate(b.path).variableCount,
  );
}
