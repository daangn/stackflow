import { createThemeContract, style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

import { globalVars } from "../basicUIPlugin.css";
import { f } from "../styles";

export const vars = createThemeContract({
  transitionDuration: null,
  zIndexes: {
    dim: null,
    paper: null,
  },
});

const allTransitions = style({
  transition: vars.transitionDuration,
});

export const enterActive = style({});
export const enterDone = style({});
export const exitActive = style({});
export const exitDone = style({
  transform: "translate3d(100%, 0, 0)",
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
  allTransitions,
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
  allTransitions,
  {
    backgroundColor: globalVars.backgroundColor,
    width: "100%",
    borderRadius: `${globalVars.bottomSheet.borderRadius} ${globalVars.bottomSheet.borderRadius} 0 0`,
    willChange: "transform, opacity",
    transform: "translate3d(0, 100%, 0)",
    opacity: 0,
    selectors: {
      [`${enterActive} &, ${enterDone} &`]: {
        transform: "translate3d(0, 0, 0)",
        opacity: 1,
      },
      [`${exitActive} &, ${exitDone} &`]: {
        transform: "translate3d(0, 100%, 0)",
        opacity: 0,
      },
    },
  },
]);
