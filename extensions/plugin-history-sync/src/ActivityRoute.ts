import type { Route } from "./RouteLike";

export interface ActivityRoute<T> extends Route<T> {
  activityName: string;
  type: "url-pattern" | "uri-template";
}
