import { createThemeContract, style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

import { f } from "../styles";
import { globalVars } from "../theme.css";

export const vars = createThemeContract({
  transitionDuration: null,
  zIndexes: {
    dim: null,
    paper: null,
  },
});

const transition = style({
  transition: vars.transitionDuration,
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
  f.flexAlignEnd,
  transition,
  {
    backgroundColor: globalVars.dimBackgroundColor,
    zIndex: vars.zIndexes.dim,
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
    backgroundColor: globalVars.backgroundColor,
    width: "100%",
    borderRadius: `${globalVars.bottomSheet.borderRadius} ${globalVars.bottomSheet.borderRadius} 0 0`,
    transform: "translateY(100%)",
    opacity: 0,
    selectors: {
      [`${enterActive} &, ${enterDone} &`]: {
        transform: "translateY(0)",
        opacity: 1,
      },
      [`${exitActive} &, ${exitDone} &`]: {
        transform: "translateY(100%)",
        opacity: 0,
      },
    },
  },
]);
