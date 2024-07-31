/* @jsxImportSource solid-js */

import type { StackflowSolidPlugin } from "@stackflow/solid";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import type { JSXElement } from "solid-js";
import { createContext, useContext } from "solid-js";

import * as css from "../common/basicUIPlugin.css";
import type { RecursivePartial } from "../common/utils";
import { compact, compactMap } from "../common/utils";

type BasicUIPluginOptions = RecursivePartial<css.GlobalVars> & {
  theme: "android" | "cupertino";
  rootClassName?: string;
  appBar?: {
    backButton?:
      | {
          renderIcon?: () => JSXElement;
          ariaLabel?: string;
        }
      | {
          render?: () => JSXElement;
        };
    closeButton?:
      | {
          renderIcon?: () => JSXElement;
          ariaLabel?: string;
          onClick?: (e: MouseEvent) => void;
        }
      | {
          render?: () => JSXElement;
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
) => StackflowSolidPlugin = (options) => () => ({
  key: "basic-ui",
  wrapStack({ stack, initialContext }) {
    const _options =
      typeof options === "function" ? options({ initialContext }) : options;

    return (
      <GlobalOptionsProvider
        value={{
          ...options,
          theme: initialContext()?.theme ?? _options.theme,
        }}
      >
        <div
          class={compact([
            css.stackWrapper({
              theme: initialContext()?.theme ?? _options.theme,
              loading: stack.globalTransitionState === "loading",
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
