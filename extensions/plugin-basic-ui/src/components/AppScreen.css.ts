import { createThemeContract, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";
import { recipe } from "@vanilla-extract/recipes";

import { f } from "../styles";
import {
  android,
  cupertino,
  globalVars,
  rootAndroid,
  rootCupertino,
} from "../theme.css";

export const vars = createThemeContract({
  transitionDuration: null,
  zIndexes: {
    dim: null,
    paper: null,
    edge: null,
    appBar: null,
  },
  appBar: {
    center: {
      mainWidth: null,
    },
  },
});

const dimBackgroundColor = style({
  backgroundColor: globalVars.dimBackgroundColor,
});

export const background = style({
  backgroundColor: globalVars.backgroundColor,
});

export const allTransitions = style({
  transition: vars.transitionDuration,
});

export const enterActive = style({});
export const enterDone = style({});
export const exitActive = style({});
export const exitDone = style({
  transform: "translateX(100%)",
});

export const appScreen = recipe({
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
  dimBackgroundColor,
  allTransitions,
  {
    opacity: 0,
    zIndex: vars.zIndexes.dim,
    selectors: {
      [`${android} &, ${rootAndroid} &`]: {
        height: "10rem",
        background: `linear-gradient(${globalVars.dimBackgroundColor}, rgba(0, 0, 0, 0))`,
      },
      [`${enterActive} &`]: {
        opacity: 1,
      },
      [`${enterDone} &`]: {
        opacity: 1,
      },
      [`${exitActive} &`]: {
        opacity: 0,
      },
      [`${exitDone} &`]: {
        opacity: 0,
      },
    },
  },
]);

export const paper = recipe({
  base: [
    f.posAbsFull,
    background,
    allTransitions,
    {
      overflowY: "scroll",
      WebkitOverflowScrolling: "touch",
      "::-webkit-scrollbar": {
        display: "none",
      },
      zIndex: vars.zIndexes.paper,
      selectors: {
        [`${cupertino} &, ${rootCupertino} &`]: {
          transform: "translateX(100%)",
        },
        [`${cupertino} ${enterActive} &, ${rootCupertino} ${enterActive} &`]: {
          transform: "translateX(0)",
        },
        [`${cupertino} ${enterDone} &, ${rootCupertino} ${enterDone} &`]: {
          transform: "translateX(0)",
        },
        [`${android} &, ${rootAndroid} &`]: {
          opacity: 0,
          transform: "translateY(10rem)",
        },
        [`${android} ${enterActive} &, ${rootAndroid} ${enterActive} &`]: {
          opacity: 1,
          transform: "translateY(0)",
        },
        [`${android} ${enterDone} &, ${rootAndroid} ${enterDone} &`]: {
          opacity: 1,
          transform: "translateY(0)",
        },
      },
    },
  ],
  variants: {
    hasAppBar: {
      true: [
        f.borderBox,
        {
          paddingTop: [
            `calc(${globalVars.appBar.height} + constant(safe-area-inset-top))`,
            `calc(${globalVars.appBar.height} + env(safe-area-inset-top))`,
          ],
        },
      ],
    },
  },
});

export const edge = recipe({
  base: [
    f.posAbs,
    f.top0,
    f.left0,
    f.fullHeight,
    {
      width: "1.25rem",
      zIndex: vars.zIndexes.edge,
    },
  ],
  variants: {
    hasAppBar: {
      true: {
        top: globalVars.appBar.height,
        height: calc("100%").subtract(globalVars.appBar.height).toString(),
      },
    },
  },
});
