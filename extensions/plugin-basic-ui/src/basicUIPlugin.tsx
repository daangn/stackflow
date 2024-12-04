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
  options:
    | BasicUIPluginOptions
    | ((args: { initialContext?: any }) => BasicUIPluginOptions),
) => StackflowReactPlugin = (options) => () => ({
  key: "basic-ui",
  wrapStack({ stack, initialContext }) {
    const _options =
      typeof options === "function" ? options({ initialContext }) : options;

    return (
      <GlobalOptionsProvider
        value={{
          ...options,
          theme: initialContext?.theme ?? _options.theme,
        }}
      >
        <div
          className={compact([
            css.stackWrapper({
              theme: initialContext?.theme ?? _options.theme,
              globalTransitionState: stack.globalTransitionState,
            }),
            _options.rootClassName,
          ]).join(" ")}
          style={assignInlineVars(
            compactMap({
              [css.globalVars.backgroundColor]: _options.backgroundColor,
              [css.globalVars.dimBackgroundColor]: _options.dimBackgroundColor,
              [css.globalVars.transitionDuration]:
                `${stack.transitionDuration}ms`,
              [css.globalVars.computedTransitionDuration]:
                stack.globalTransitionState === "loading"
                  ? `${stack.transitionDuration}ms`
                  : "0ms",
              [css.globalVars.appBar.borderColor]: _options.appBar?.borderColor,
              [css.globalVars.appBar.borderSize]: _options.appBar?.borderSize,
              [css.globalVars.appBar.height]: _options.appBar?.height,
              [css.globalVars.appBar.iconColor]: _options.appBar?.iconColor,
              [css.globalVars.appBar.textColor]: _options.appBar?.textColor,
              [css.globalVars.appBar.minSafeAreaInsetTop]:
                _options.appBar?.minSafeAreaInsetTop,
              [css.globalVars.bottomSheet.borderRadius]:
                _options.bottomSheet?.borderRadius,
              [css.globalVars.modal.borderRadius]: _options.modal?.borderRadius,
            }),
          )}
        >
          {stack.render()}
        </div>
      </GlobalOptionsProvider>
    );
  },
});
