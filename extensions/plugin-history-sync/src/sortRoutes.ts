import { makeTemplate } from "./makeTemplate";
import { normalizeRoute } from "./normalizeRoute";

type Route = {
  activityName: string;
  templateStr: string;
};

export function sortRoutes<
  T extends {
    [activityName: string]: string | string[];
  },
>(routeMap: T): Array<Route> {
  const activityNames = Object.keys(routeMap);
  const routes: Route[] = [];

  for (const activityName of activityNames) {
    const templateStrs = normalizeRoute(routeMap[activityName]);

    for (const templateStr of templateStrs) {
      routes.push({
        activityName,
        templateStr,
      });
    }
  }

  return routes.sort(
    (a, b) =>
      makeTemplate(a.templateStr).variableCount -
      makeTemplate(b.templateStr).variableCount,
  );
}
