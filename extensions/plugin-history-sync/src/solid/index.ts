import type { ConfigHistorySync } from "../common/makeHistorySyncPlugin";

declare module "@stackflow/config" {
  interface ActivityDefinition<ActivityName extends string> {
    path: string;
  }

  interface Config<T extends ActivityDefinition<string>> {
    historySync?: ConfigHistorySync;
  }
}

export { makeTemplate, UrlPatternOptions } from "../common/makeTemplate";
export { useHistoryTick } from "./HistoryQueueContext.solid";
export * from "./historySyncPlugin.solid";
export { useRoutes } from "./RoutesContext.solid";
