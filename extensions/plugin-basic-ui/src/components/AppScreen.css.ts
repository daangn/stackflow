import { createThemeContract, style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

import { android, cupertino, globalVars } from "../basicUIPlugin.css";
import { f } from "../styles";

export const vars = createThemeContract({
  transitionDuration: null,
  zIndexes: {
    dim: null,
    paper: null,
    edge: null,
    appBar: null,
  },
  appBar: {
    topMargin: null,
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
  backgroundImage: globalVars.backgroundImage,
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
    hasAppBar: {
      true: {
        vars: {
          [vars.appBar.topMargin]: globalVars.appBar.height,
        },
        /**
         * When `max()` and `env()` (or `constant()`) supported
         *
         * - https://caniuse.com/css-env-function
         * - https://caniuse.com/css-math-functions
         */
        "@supports": {
          "(padding: max(0px)) and (padding: constant(safe-area-inset-top))": {
            vars: {
              [vars.appBar.topMargin]:
                `calc(${globalVars.appBar.height} + max(${globalVars.appBar.minSafeAreaInsetTop}, constant(safe-area-inset-top)))`,
            },
          },
          "(padding: max(0px)) and (padding: env(safe-area-inset-top))": {
            vars: {
              [vars.appBar.topMargin]:
                `calc(${globalVars.appBar.height} + max(${globalVars.appBar.minSafeAreaInsetTop}, env(safe-area-inset-top)))`,
            },
          },
        },
      },
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
    height: globalVars.dimHeight,
    selectors: {
      [`${android} &`]: {
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
      zIndex: vars.zIndexes.paper,
      selectors: {
        [`${cupertino} &`]: {
          transform: "translate3d(100%, 0, 0)",
        },
        [`
          ${cupertino} ${enterActive} &,
          ${cupertino} ${enterDone} &
        `]: {
          transform: "translate3d(0, 0, 0)",
        },
        [`${android} &`]: {
          opacity: 0,
          transform: "translate3d(0, 10rem, 0)",
        },
        [`
          ${android} ${enterActive} &,
          ${android} ${enterDone} &
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
          transition: `transform ${vars.transitionDuration}, opacity ${vars.transitionDuration}, margin-top ${globalVars.appBar.heightTransitionDuration}`,
          paddingTop: vars.appBar.topMargin,
        },
      ],
    },
    modalPresentationStyle: {
      fullScreen: {
        selectors: {
          [`${cupertino} &`]: {
            transform: "translate3d(0, 100%, 0)",
          },
        },
      },
    },
    activityEnterStyle: {
      slideInLeft: {
        selectors: {
          [`${android} &`]: {
            transform: "translate3d(50%, 0, 0)",
          },
        },
      },
    },
  },
});

export const paperContent = recipe({
  base: [
    f.posAbsFull,
    {
      overflowY: "scroll",
      WebkitOverflowScrolling: "touch",
      "::-webkit-scrollbar": {
        display: "none",
      },
    },
  ],

  variants: {
    hasAppBar: {
      true: {
        marginTop: vars.appBar.topMargin,
        height: `calc(100% - ${vars.appBar.topMargin})`,
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
        top: vars.appBar.topMargin,
        height: `calc(100% - ${vars.appBar.topMargin})`,
      },
    },
  },
});
