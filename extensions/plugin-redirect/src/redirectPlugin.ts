import type { StackflowReactPlugin } from "@stackflow/react";

type HistorySyncPluginOptions<K extends string> = {
  redirects: {
    [key in K]?: Exclude<K, key> | Exclude<K, key>[];
  };
};

export function redirectPlugin<T extends { [activityName: string]: unknown }>(
  options: HistorySyncPluginOptions<Extract<keyof T, string>>,
): StackflowReactPlugin<T> {
  type K = Extract<keyof T, string>;

  return () => ({
    key: "@stackflow/plugin-redirect",
  });
}
