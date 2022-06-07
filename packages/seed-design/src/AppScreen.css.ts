import {
  createGlobalThemeContract,
  createTheme,
  style,
} from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

const vars = createGlobalThemeContract(
  {
    backgroundColor: null,
    dimBackgroundColor: null,
    transitionDuration: "",
  },
  (_, path) => `stackflow-seed-design-${path.join("-")}`,
);

const Android = createTheme(vars, {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  transitionDuration: "",
});

const Cupertino = createTheme(vars, {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  transitionDuration: "",
});

export const appScreenEnterActive = style({
  display: "block",
});
export const appScreenEnterDone = style({
  display: "block",
});
export const appScreenExitActive = style({
  display: "block",
});
export const appScreenExitDone = style({
  display: "block",
});

export const appScreen = recipe({
  base: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  variants: {
    theme: {
      Android,
      Cupertino,
    },
  },
});

export const dim = style({
  backgroundColor: vars.dimBackgroundColor,
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  transition: `opacity ${vars.transitionDuration}`,
  selectors: {
    [`${appScreenEnterActive} > &`]: {
      opacity: 1,
    },
    [`${appScreenEnterDone} > &`]: {
      opacity: 1,
    },
    [`${appScreenExitActive} > &`]: {
      opacity: 0,
    },
    [`${appScreenExitDone} > &`]: {
      opacity: 0,
    },
  },
});

export const paper = recipe({
  base: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: vars.backgroundColor,
    transform: "translateX(100%)",
    transition: `transform ${vars.transitionDuration}`,
    selectors: {
      [`${appScreenEnterActive} > &`]: {
        transform: "translateX(0)",
      },
      [`${appScreenEnterDone} > &`]: {
        transform: "translateX(0)",
      },
    },
  },
  variants: {
    isTop: {
      true: {},
      false: {
        selectors: {
          [`${appScreenEnterActive} > &`]: {
            transform: "translateX(-5rem)",
          },
          [`${appScreenEnterDone} > &`]: {
            transform: "translateX(-5rem)",
          },
        },
      },
    },
  },
});

export { vars };
