import { StackflowReactPlugin } from "@stackflow/react";
import React from "react";

import AppScreen from "./AppScreen";

const fallbackTheme = /iphone|ipad|ipod/i.test(
  navigator.userAgent.toLowerCase(),
)
  ? "cupertino"
  : "android";

interface UiPluginOptions {
  theme?: "android" | "cupertino";
}
export function uiPlugin(options?: UiPluginOptions): StackflowReactPlugin {
  return () => ({
    key: "uiPlugin",
    wrapActivity({ activity }) {
      return (
        <AppScreen theme={options?.theme ?? fallbackTheme} appBar={{}}>
          {activity.render()}
        </AppScreen>
      );
    },
  });
}
