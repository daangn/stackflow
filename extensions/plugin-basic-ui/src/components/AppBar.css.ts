import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

import { android, cupertino, globalVars } from "../basicUIPlugin.css";
import { f } from "../styles";
import {
  background,
  enterActive,
  enterDone,
  exitActive,
  vars,
} from "./AppScreen.css";

const appBarMinHeight = style({
  minHeight: globalVars.appBar.minHeight,
});
const appBarOverflow = style({
  overflow: globalVars.appBar.overflow,
});

function transitions(args: { [cssFieldName: string]: string }) {
  return Object.entries(args)
    .map(([cssFieldName, value]) => `${cssFieldName} ${value}`)
    .join(", ");
}
const appBarCommonTransition = {
  "background-color": globalVars.appBar.backgroundColorTransitionDuration,
  "box-shadow": globalVars.appBar.borderColorTransitionDuration,
};

export const appBar = recipe({
  base: [
    f.posAbs,
    f.fullWidth,
    f.contentBox,
    background,
    appBarOverflow,
    {
      backgroundColor: globalVars.appBar.backgroundColor,
      zIndex: vars.zIndexes.appBar,
      willChange: "transform, opacity",
      transition: transitions(appBarCommonTransition),
      selectors: {
        [`${cupertino} &`]: {
          position: "absolute",
        },
        [`${cupertino} ${exitActive} &`]: {
          transform: "translate3d(100%, 0, 0)",
          transition: transitions({
            ...appBarCommonTransition,
            transform: "0s",
          }),
        },
        [`${android} &`]: {
          opacity: 0,
          transform: "translate3d(0, 10rem, 0)",
          transition: transitions({
            ...appBarCommonTransition,
            transform: vars.transitionDuration,
            opacity: vars.transitionDuration,
          }),
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
    border: {
      true: {
        boxShadow: `inset 0px calc(-1 * ${globalVars.appBar.borderSize}) 0 ${globalVars.appBar.borderColor}`,
      },
    },
    modalPresentationStyle: {
      fullScreen: {
        selectors: {
          [`${cupertino} &`]: {
            transform: "translate3d(0, 100vh, 0)",
            transition: transitions({
              ...appBarCommonTransition,
              transform: vars.transitionDuration,
              opacity: vars.transitionDuration,
            }),
          },
          [`
            ${cupertino} ${enterActive} &,
            ${cupertino} ${enterDone} &
          `]: {
            transform: "translate3d(0, 0, 0)",
          },
          [`${cupertino} ${exitActive} &`]: {
            transform: "translate3d(0, 100vh, 0)",
            transition: transitions({
              ...appBarCommonTransition,
              transform: vars.transitionDuration,
              opacity: vars.transitionDuration,
            }),
          },
        },
      },
    },
    activityEnterStyle: {
      slideInLeft: {
        selectors: {
          [`${android} &`]: {
            opacity: 1,
            transform: "translate3d(0, 0, 0)",
          },
          [`${android} ${exitActive} &`]: {
            transform: "translate3d(100%, 0, 0)",
            transition: transitions({
              ...appBarCommonTransition,
              transform: "0s",
            }),
          },
        },
      },
    },
  },
});

export const safeArea = style({
  height: [
    `max(${globalVars.appBar.minSafeAreaInsetTop}, constant(safe-area-inset-top))`,
    `max(${globalVars.appBar.minSafeAreaInsetTop}, env(safe-area-inset-top))`,
  ],
});

export const container = style([
  f.flexAlignEnd,
  appBarOverflow,
  {
    height: globalVars.appBar.height,
    transition: transitions({
      height: globalVars.appBar.heightTransitionDuration,
    }),
  },
]);

export const left = style([
  f.flexAlignCenter,
  f.fullHeight,
  appBarMinHeight,
  {
    padding: "0 0.5rem",
    ":empty": {
      display: "none",
    },
  },
]);

export const backButton = style([
  f.flexAlignCenter,
  f.flexJustifyCenter,
  f.cursorPointer,
  f.resetButton,
  {
    color: globalVars.appBar.iconColor,
    transition: transitions({
      opacity: "300ms",
      color: globalVars.appBar.iconColorTransitionDuration,
    }),
    width: "2.25rem",
    height: "2.75rem",
    ":active": {
      opacity: "0.2",
      transition: transitions({
        opacity: "0s",
        color: globalVars.appBar.iconColorTransitionDuration,
      }),
    },
  },
]);

export const closeButton = style([backButton]);

export const center = style([f.flexAlignCenter, f.flex1, appBarMinHeight]);

export const centerMain = recipe({
  base: {
    width: vars.appBar.center.mainWidth,
    color: globalVars.appBar.textColor,
    transition: transitions({
      height: globalVars.appBar.heightTransitionDuration,
      color: globalVars.appBar.textColorTransitionDuration,
    }),
    selectors: {
      [`${android} &`]: {
        width: "100%",
        justifyContent: "flex-start",
        paddingLeft: "1rem",
        fontSize: "1.1875rem",
        lineHeight: "1.5",
        fontWeight: "bold",
        boxSizing: "border-box",
      },
      [`${cupertino} &`]: {
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont",
        fontWeight: 600,
        fontSize: "1rem",
        left: "50%",
        transform: "translate(-50%)",
        height: globalVars.appBar.height,
        top: [
          `max(${globalVars.appBar.minSafeAreaInsetTop}, constant(safe-area-inset-top))`,
          `max(${globalVars.appBar.minSafeAreaInsetTop}, env(safe-area-inset-top))`,
        ],
      },
    },
  },
  variants: {
    hasLeft: {
      true: {
        selectors: {
          [`${android} &`]: {
            paddingLeft: "0.375rem",
          },
        },
      },
    },
  },
});

export const centerMainEdge = style([
  f.resetButton,
  f.posAbs,
  f.top0,
  f.cursorPointer,
  {
    left: "50%",
    height: "1.25rem",
    transform: "translate(-50%)",
    maxWidth: "5rem",
    display: "none",
    width: vars.appBar.center.mainWidth,
    selectors: {
      [`${cupertino} &`]: {
        display: "block",
      },
    },
  },
]);

export const centerText = style([
  f.overflowHidden,
  f.whiteSpaceNowrap,
  f.fullWidth,
  {
    textOverflow: "ellipsis",
    fontSize: "inherit",
    fontWeight: "inherit",
  },
]);

export const right = style([
  f.flexAlignCenter,
  f.fullHeight,
  f.posRel,
  appBarMinHeight,
  {
    padding: "0 0.5rem",
    marginLeft: "auto",
    ":empty": {
      display: "none",
    },
    selectors: {
      [`${android} &`]: {
        padding: "0 0.5rem 0 0",
      },
    },
  },
]);
