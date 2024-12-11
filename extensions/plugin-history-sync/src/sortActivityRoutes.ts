import type { ActivityRoute } from "./ActivityRoute";

const paramRe = /^:[\w-]+$/;
const dynamicSegmentValue = 3;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const splatPenalty = -2;
const isSplat = (s: string) => s === "*";

/**
 * https://github.com/remix-run/react-router/blob/0f2b167e9b862d5e6b3425438787c8e7b39197f4/packages/router/utils.ts#L742-L773
 */
function computeScore(path: string): number {
  const segments = path.split("/");
  let initialScore = segments.length;
  if (segments.some(isSplat)) {
    initialScore += splatPenalty;
  }

  return segments
    .filter((s) => !isSplat(s))
    .reduce(
      (score, segment) =>
        score +
        (paramRe.test(segment)
          ? dynamicSegmentValue
          : segment === ""
            ? emptySegmentValue
            : staticSegmentValue),
      initialScore,
    );
}

export function sortActivityRoutes<T>(
  routes: ActivityRoute<T>[],
): ActivityRoute<T>[] {
  const routesByPriority = routes.reduce((acc, route) => {
    const array = acc.get(route.priority ?? 0);
    if (array) array.push(route)
    else acc.set(route.priority ?? 0, [route]);
    return acc;
  }, new Map<number, ActivityRoute<T>[]>());
  return [...routesByPriority.entries()].sort(
    ([priorityA], [priorityB]) => priorityB - priorityA,
  ).flatMap(([_, routes]) =>
    routes.sort((a, b) => computeScore(b.path) - computeScore(a.path)),
  )
}
