import {
  createGlobalTheme,
  createGlobalThemeContract,
  createTheme,
} from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

const GLOBAL_VARS = {
  backgroundColor: "background-color",
  backgroundImage: "background-image",
  dimBackgroundColor: "dim-background-color",
  dimHeight: "dim-height",
  edgeWidth: "edge-width",
  transitionDuration: "transition-duration",
  computedTransitionDuration: "computed-transition-duration",
  defaultTransitionOffSet: "default-transition-off-set",
  appBar: {
    borderColor: "app-bar-border-color",
    borderColorTransitionDuration: "app-bar-border-color-transition-duration",
    borderSize: "app-bar-border-size",
    height: "app-bar-height",
    heightTransitionDuration: "app-bar-height-transition-duration",
    minHeight: "app-bar-min-height",
    iconColor: "app-bar-icon-color",
    iconColorTransitionDuration: "app-bar-icon-color-transition-duration",
    textColor: "app-bar-text-color",
    textColorTransitionDuration: "app-bar-text-color-transition-duration",
    backgroundColor: "app-bar-background-color",
    backgroundColorTransitionDuration:
      "app-bar-background-color-transition-duration",
    backgroundImage: "app-bar-background-image",
    backgroundImageTransitionDuration:
      "app-bar-background-image-transition-duration",
    overflow: "app-bar-overflow",
    minSafeAreaInsetTop: "app-bar-min-safe-area-inset-top",
    containerPadding: "app-bar-container-padding",
    itemGap: "app-bar-item-gap",
    fontSize: "app-bar-font-size",
    lineHeight: "app-bar-line-height",
    hitSlop: "app-bar-hit-slop",
  },
  bottomSheet: {
    borderRadius: "bottom-sheet-border-radius",
  },
  modal: {
    borderRadius: "modal-border-radius",
    maxWidth: "modal-max-width",
  },
};

export const globalVars = createGlobalThemeContract(
  GLOBAL_VARS,
  (value) => `stackflow-plugin-basic-ui-${value}`,
);

export type GlobalVars = typeof GLOBAL_VARS;

const androidValues: GlobalVars = {
  backgroundColor: "#fff",
  backgroundImage: "unset",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  dimHeight: "10rem",
  edgeWidth: "1.25rem",
  transitionDuration: "0s",
  computedTransitionDuration: "0s",
  defaultTransitionOffSet: "10rem",
  appBar: {
    borderColor: "rgba(0, 0, 0, 0.07)",
    borderColorTransitionDuration: "0s",
    borderSize: "1px",
    height: "3.5rem",
    heightTransitionDuration: "0s",
    minHeight: "3.5rem",
    iconColor: "#212124",
    iconColorTransitionDuration: "0s",
    textColor: "#212124",
    textColorTransitionDuration: "0s",
    backgroundColor: "#fff",
    backgroundColorTransitionDuration: "0s",
    backgroundImage: "unset",
    backgroundImageTransitionDuration: "0s",
    overflow: "hidden",
    minSafeAreaInsetTop: "0px",
    containerPadding: "1rem",
    itemGap: "1rem",
    fontSize: "1.125rem",
    hitSlop: "0.5rem",
    lineHeight: "1.5",
  },
  bottomSheet: {
    borderRadius: "1rem",
  },
  modal: {
    borderRadius: "1rem",
    maxWidth: "100%",
  },
};

const cupertinoValues: GlobalVars = {
  ...androidValues,
  dimHeight: "100%",
  defaultTransitionOffSet: "100%",
  appBar: {
    ...androidValues.appBar,
    height: "2.75rem",
    minHeight: "2.75rem",
    borderSize: "0.5px",
    lineHeight: "normal",
  },
};

export const android = createTheme(globalVars, {
  ...androidValues,
});
export const cupertino = createTheme(globalVars, {
  ...cupertinoValues,
});

createGlobalTheme(
  ":root[data-stackflow-plugin-basic-ui-theme=cupertino]",
  globalVars,
  cupertinoValues,
);
createGlobalTheme(
  ":root[data-stackflow-plugin-basic-ui-theme=android]",
  globalVars,
  androidValues,
);

export const stackWrapper = recipe({
  base: {},
  variants: {
    theme: {
      android,
      cupertino,
    },
  },
});
