import { createThemeContract, style } from "@vanilla-extract/css";
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
  transition: `transform ${vars.transitionDuration}, opacity ${vars.transitionDuration}`,
});

export const enterActive = style({});
export const enterDone = style({});
export const exitActive = style({});
export const exitDone = style({
  transform: "translate3d(100%, 0, 0)",
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
    willChange: "opacity",
    selectors: {
      [`
        ${android} &,
        ${rootAndroid} &
      `]: {
        height: "10rem",
        background: `linear-gradient(${globalVars.dimBackgroundColor}, rgba(0, 0, 0, 0))`,
      },
      [`
        ${enterActive} &,
        ${enterDone} &
      `]: {
        opacity: 1,
      },
      [`
        ${exitActive} &,
        ${exitDone} &
      `]: {
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
      willChange: "transform",
      selectors: {
        [`
          ${cupertino} &,
          ${rootCupertino} &
        `]: {
          transform: "translate3d(100%, 0, 0)",
        },
        [`
          ${cupertino} ${enterActive} &,
          ${rootCupertino} ${enterActive} &,
          ${cupertino} ${enterDone} &,
          ${rootCupertino} ${enterDone} &
        `]: {
          transform: "translate3d(0, 0, 0)",
        },
        [`
          ${android} &,
          ${rootAndroid} &
        `]: {
          opacity: 0,
          transform: "translate3d(0, 10rem, 0)",
        },
        [`
          ${android} ${enterActive} &,
          ${rootAndroid} ${enterActive} &,
          ${android} ${enterDone} &,
          ${rootAndroid} ${enterDone} &
        `]: {
          opacity: 1,
          transform: "translate3d(0, 0, 0)",
        },
      },
    },
  ],
  variants: {
    hasAppBar: {
      true: [
        f.borderBox,
        {
          transition: `transform ${vars.transitionDuration}, opacity ${vars.transitionDuration}, padding-top ${globalVars.appBar.heightTransitionDuration}`,
          paddingTop: [
            `calc(${globalVars.appBar.height} + constant(safe-area-inset-top))`,
            `calc(${globalVars.appBar.height} + env(safe-area-inset-top))`,
          ],
        },
      ],
    },
    presentModalFullScreen: {
      true: {
        selectors: {
          [`
            ${cupertino} &,
            ${rootCupertino} &
          `]: {
            transform: "translate3d(0, 100%, 0)",
          },
        },
      },
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
        height: `calc(100% - ${globalVars.appBar.height})`,
      },
    },
  },
});
