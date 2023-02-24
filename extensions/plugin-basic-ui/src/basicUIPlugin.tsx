import type { StackflowReactPlugin } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import { createContext, useContext } from "react";

import * as css from "./basicUIPlugin.css";
import type { RecursivePartial } from "./utils";
import { compact, compactMap, isBrowser } from "./utils";

type BasicUIPluginOptions = RecursivePartial<css.GlobalVars> & {
  theme: "android" | "cupertino";
  rootClassName?: string;
  appBar?: {
    backButton?:
      | {
          renderIcon?: () => React.ReactNode;
          ariaLabel?: string;
        }
      | {
          render?: () => React.ReactNode;
        };
    closeButton?:
      | {
          renderIcon?: () => React.ReactNode;
          ariaLabel?: string;
          onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
        }
      | {
          render?: () => React.ReactNode;
        };
  };
};

const GlobalOptionsContext = createContext<BasicUIPluginOptions>({
  theme: "android",
});

export const GlobalOptionsProvider = GlobalOptionsContext.Provider;

export function useGlobalOptions() {
  return useContext(GlobalOptionsContext);
}

export const basicUIPlugin: (
  options: BasicUIPluginOptions,
) => StackflowReactPlugin = (options) => () => ({
  key: "basic-ui",
  wrapStack({ stack }) {
    return (
      <GlobalOptionsProvider value={options}>
        <div
          className={compact([
            css.stackWrapper({
              theme: isBrowser() ? options.theme : undefined,
              loading: stack.globalTransitionState === "loading",
            }),
            options.rootClassName,
          ]).join(" ")}
          style={assignInlineVars(
            compactMap({
              [css.globalVars.backgroundColor]: options.backgroundColor,
              [css.globalVars.dimBackgroundColor]: options.dimBackgroundColor,
              [css.globalVars
                .transitionDuration]: `${stack.transitionDuration}ms`,
              [css.globalVars.computedTransitionDuration]:
                stack.globalTransitionState === "loading"
                  ? `${stack.transitionDuration}ms`
                  : "0ms",
              [css.globalVars.appBar.borderColor]: options.appBar?.borderColor,
              [css.globalVars.appBar.borderSize]: options.appBar?.borderSize,
              [css.globalVars.appBar.height]: options.appBar?.height,
              [css.globalVars.appBar.iconColor]: options.appBar?.iconColor,
              [css.globalVars.appBar.textColor]: options.appBar?.textColor,
              [css.globalVars.bottomSheet.borderRadius]:
                options.bottomSheet?.borderRadius,
              [css.globalVars.modal.borderRadius]: options.modal?.borderRadius,
            }),
          )}
        >
          {stack.render()}
        </div>
      </GlobalOptionsProvider>
    );
  },
});
