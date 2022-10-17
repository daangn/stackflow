import type { StackflowReactPlugin } from "@stackflow/react";
import React from "react";

import * as css from "./globalVars.css";

interface BasicUIPluginOptions {
  theme: "android" | "cupertino";
}
export const basicUIPlugin: (
  options: BasicUIPluginOptions,
) => StackflowReactPlugin = (options) => () => ({
  key: "basic-ui",
  wrapStack({ stack }) {
    return (
      <div
        className={options.theme === "cupertino" ? css.cupertino : css.android}
      >
        {stack.render()}
      </div>
    );
  },
});
