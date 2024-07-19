import type { ActivityRoute } from "./ActivityRoute";
import { makeTemplate } from "./makeTemplate";

export function sortActivityRoutes<T>(
  routes: ActivityRoute<T>[],
): ActivityRoute<T>[] {
  return [...routes].sort(
    (a, b) => makeTemplate(a).variableCount - makeTemplate(b).variableCount,
  );
}
