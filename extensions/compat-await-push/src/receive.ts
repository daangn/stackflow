import { resolveMap } from "./resolveMap";

export function receive<T = unknown>({ activityId }: { activityId: string }) {
  return new Promise<T>((resolve: any) => {
    resolveMap[activityId] = resolve;
  });
}
