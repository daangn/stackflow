import { resolveMap } from "./resolveMap";

export function send({
  activityId,
  data,
}: {
  activityId: string;
  data: unknown;
}) {
  resolveMap[activityId]?.(data);
}
