import type { StackflowReactPlugin } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React from "react";

import { ThemeProvider } from "./hooks";
import * as theme from "./theme.css";
import { compactMap } from "./utils";

type RPartial<K> = {
  [attr in keyof K]?: K[attr] extends object ? RPartial<K[attr]> : K[attr];
};

type BasicUIPluginOptions = RPartial<theme.GlobalVars> & {
  theme: "android" | "cupertino";
};

export const basicUIPlugin: (
  options: BasicUIPluginOptions,
) => StackflowReactPlugin = (options) => () => ({
  key: "basic-ui",
  wrapStack({ stack }) {
    return (
      <ThemeProvider value={options.theme}>
        <div
          className={theme[options.theme]}
          style={assignInlineVars(
            compactMap({
              [theme.globalVars.backgroundColor]: options.backgroundColor,
              [theme.globalVars.dimBackgroundColor]: options.dimBackgroundColor,
              [theme.globalVars.appBar.borderColor]:
                options.appBar?.borderColor,
              [theme.globalVars.appBar.borderSize]: options.appBar?.borderSize,
              [theme.globalVars.appBar.height]: options.appBar?.height,
              [theme.globalVars.appBar.iconColor]: options.appBar?.iconColor,
              [theme.globalVars.appBar.textColor]: options.appBar?.textColor,
              [theme.globalVars.bottomSheet.borderRadius]:
                options.bottomSheet?.borderRadius,
              [theme.globalVars.modal.borderRadius]:
                options.modal?.borderRadius,
            }),
          )}
        >
          {stack.render()}
        </div>
      </ThemeProvider>
    );
  },
});
