import { StackflowReactPlugin } from "@stackflow/react";
import React from "react";

import AppScreen from "./AppScreen";

const fallbackTheme = /iphone|ipad|ipod/i.test(
  navigator.userAgent.toLowerCase(),
)
  ? "cupertino"
  : "android";

interface UiPluginOptions<T extends { [key: string]: any }> {
  theme?: "android" | "cupertino";
  exclude?: Array<Extract<keyof T, string>>;
}
export function uiPlugin<T extends { [key: string]: any }>(
  options?: UiPluginOptions<T>,
): StackflowReactPlugin {
  return () => ({
    key: "uiPlugin",
    wrapActivity({ activity }) {
      if (options?.exclude?.includes(activity.name as any)) {
        return <>{activity.render()}</>;
      }

      return (
        <AppScreen theme={options?.theme ?? fallbackTheme} appBar={{}}>
          {activity.render()}
        </AppScreen>
      );
    },
  });
}
