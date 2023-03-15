import {
  createGlobalTheme,
  createGlobalThemeContract,
  createTheme,
} from "@vanilla-extract/css";
import type { MapLeafNodes } from "@vanilla-extract/private";
import { recipe } from "@vanilla-extract/recipes";

export const globalVars = createGlobalThemeContract(
  {
    backgroundColor: "background-color",
    dimBackgroundColor: "dim-background-color",
    transitionDuration: "transition-duration",
    computedTransitionDuration: "computed-transition-duration",
    appBar: {
      borderColor: "app-bar-border-color",
      borderSize: "app-bar-border-size",
      height: "app-bar-height",
      heightTransitionDuration: "app-bar-height-transition-duration",
      minHeight: "app-bar-min-height",
      iconColor: "app-bar-icon-color",
      textColor: "app-bar-text-color",
      backgroundColor: "app-bar-background-color",
      overflow: "app-bar-overflow",
    },
    bottomSheet: {
      borderRadius: "bottom-sheet-border-radius",
    },
    modal: {
      borderRadius: "bottom-sheet-border-radius",
    },
  },
  (value) => `stackflow-plugin-basic-ui-${value}`,
);

type InferVars<T> = T extends MapLeafNodes<infer U, any> ? U : never;
export type GlobalVars = InferVars<typeof globalVars>;

const androidValues: GlobalVars = {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  transitionDuration: "0ms",
  computedTransitionDuration: "0ms",
  appBar: {
    borderColor: "rgba(0, 0, 0, 0.07)",
    borderSize: "1px",
    height: "3.5rem",
    heightTransitionDuration: "0ms",
    minHeight: "3.5rem",
    iconColor: "#212124",
    textColor: "#212124",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  bottomSheet: {
    borderRadius: "1rem",
  },
  modal: {
    borderRadius: "1rem",
  },
};

const cupertinoValues: GlobalVars = {
  ...androidValues,
  appBar: {
    ...androidValues.appBar,
    height: "2.75rem",
    minHeight: "2.75rem",
    borderSize: "0.5px",
  },
};

export const android = createTheme(globalVars, {
  ...androidValues,
});
export const cupertino = createTheme(globalVars, {
  ...cupertinoValues,
});

export const stackWrapper = recipe({
  base: {},
  variants: {
    theme: {
      android,
      cupertino,
    },
    loading: {
      true: {
        pointerEvents: "none",
      },
    },
  },
});
