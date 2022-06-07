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
    appBar: {
      iconColor: null,
      borderColor: null,
      borderSize: null,
      height: null,
      center: {
        textColor: null,
        mainWidth: null,
      },
      animationDuration: "",
      translateY: null,
    },
    animationDuration: "",
  },
  (_, path) => `stackflow-${path.join("-")}`,
);

const Android = createTheme(vars, {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  appBar: {
    iconColor: "#212529",
    borderColor: "rgba(0, 0, 0, 0.07)",
    borderSize: "1px",
    height: "3.5rem",
    center: {
      textColor: "#212529",
      mainWidth: "",
    },
    animationDuration: "",
    translateY: "0",
  },
  animationDuration: "",
});

const Cupertino = createTheme(vars, {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  appBar: {
    iconColor: "#212529",
    borderColor: "rgba(0, 0, 0, 0.12)",
    borderSize: "0.5px",
    height: "2.75rem",
    center: {
      textColor: "#212529",
      mainWidth: "",
    },
    animationDuration: "",
    translateY: "0",
  },
  animationDuration: "",
});

export const enterActive = style({
  display: "block",
});
export const enterDone = style({
  display: "block",
});
export const exitActive = style({
  display: "block",
});
export const exitDone = style({
  display: "none",
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
    transitionState: {
      "enter-active": enterActive,
      "enter-done": enterDone,
      "exit-active": exitActive,
      "exit-done": exitDone,
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
  transition: "opacity 300ms",
  selectors: {
    [`${enterActive} > &`]: {
      opacity: 1,
    },
    [`${enterDone} > &`]: {
      opacity: 1,
    },
    [`${exitActive} > &`]: {
      opacity: 0,
    },
    [`${exitDone} > &`]: {
      opacity: 0,
      display: "none",
    },
  },
});

export const paper = style({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: vars.backgroundColor,
  transform: "translateX(100%)",
  transition: "transform 300ms",

  selectors: {
    [`${enterActive} > &`]: {
      transform: "translateX(0)",
    },
    [`${enterDone} > &`]: {
      transform: "translateX(0)",
    },
  },
});

export { vars };
