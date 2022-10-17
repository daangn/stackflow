import { createThemeContract, style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

import { vars } from "./AppScreen.css";
import { f } from "./styles";

export const localVars = createThemeContract({
  transitionDuration: null,
  zIndexes: {
    dim: null,
    paper: null,
  },
  paperBorderRadius: null,
});

const transition = style({
  transition: localVars.transitionDuration,
});

export const enterActive = style({});
export const enterDone = style({});
export const exitActive = style({});
export const exitDone = style({
  transform: "translateX(100%)",
});

export const container = recipe({
  base: [f.posAbsFull, f.overflowHidden],
  variants: {
    transitionState: {
      "enter-active": enterActive,
      "enter-done": enterDone,
      "exit-active": exitActive,
      "exit-done": exitDone,
    },
  },
});

export const dim = style([
  f.posAbsFull,
  f.overflowHidden,
  f.flexAlignCenter,
  f.flexJustifyCenter,
  transition,
  {
    backgroundColor: vars.dimBackgroundColor,
    zIndex: localVars.zIndexes.dim,
    opacity: 0,
    selectors: {
      [`${enterActive} &, ${enterDone} &`]: {
        opacity: 1,
      },
      [`${exitActive} &, ${exitDone} &`]: {
        opacity: 0,
      },
    },
  },
]);

export const paper = style([
  f.overflowHidden,
  transition,
  {
    backgroundColor: vars.backgroundColor,
    width: "100%",
    margin: "0 2.5rem",
    boxShadow:
      "0px 10px 38px rgba(0, 0, 0, 0.15), 0px 9px 46px rgba(0, 0, 0, 0.12), 0px 5px 15px rgba(0, 0, 0, 0.1)",
    borderRadius: localVars.paperBorderRadius,
    transform: "scale(1.1)",
    opacity: 0,
    selectors: {
      [`${enterActive} &, ${enterDone} &`]: {
        transform: "scale(1)",
        opacity: 1,
      },
      [`${exitActive} &, ${exitDone} &`]: {
        transform: "scale(1.1)",
        opacity: 0,
      },
    },
  },
]);
