import type { ActivityRoute } from "./ActivityRoute";

const paramRe = /^:[\w-]+$/;
const dynamicSegmentValue = 3;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const splatPenalty = -2;
const isSplat = (s: string) => s === "*";

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
  return [...routes].sort(
    (a, b) => computeScore(b.path) - computeScore(a.path),
  );
}
