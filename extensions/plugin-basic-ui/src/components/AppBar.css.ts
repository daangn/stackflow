import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

import {
  android,
  cupertino,
  globalVars,
  rootAndroid,
  rootCupertino,
} from "../basicUIPlugin.css";
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
      selectors: {
        [`
          ${cupertino} &,
          ${rootCupertino} &
        `]: {
          position: "absolute",
        },
        [`
          ${cupertino} ${exitActive} &,
          ${rootCupertino} ${exitActive} &
        `]: {
          transform: "translate3d(100%, 0, 0)",
          transition: "0s",
        },
        [`
          ${android} &,
          ${rootAndroid} &
        `]: {
          opacity: 0,
          transform: "translate3d(0, 10rem, 0)",
          transition: `transform ${vars.transitionDuration}, opacity ${vars.transitionDuration}`,
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
    border: {
      true: {
        boxShadow: `inset 0px calc(-1 * ${globalVars.appBar.borderSize}) 0 ${globalVars.appBar.borderColor}`,
      },
    },
    presentModalFullScreen: {
      true: {
        selectors: {
          [`
            ${cupertino} &,
            ${rootCupertino} &
          `]: {
            transform: "translate3d(0, 100vh, 0)",
            transition: `transform ${vars.transitionDuration}, opacity ${vars.transitionDuration}`,
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
            ${cupertino} ${exitActive} &,
            ${rootCupertino} ${exitActive} &
          `]: {
            transform: "translate3d(0, 100vh, 0)",
            transition: `transform ${vars.transitionDuration}, opacity ${vars.transitionDuration}`,
          },
        },
      },
    },
  },
});

export const safeArea = style({
  height: ["constant(safe-area-inset-top)", "env(safe-area-inset-top)"],
});

export const container = style([
  f.flexAlignEnd,
  appBarOverflow,
  {
    height: globalVars.appBar.height,
    transition: `height ${globalVars.appBar.heightTransitionDuration}`,
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
    transition: "opacity 300ms",
    width: "2.25rem",
    height: "2.75rem",
    ":active": {
      opacity: "0.2",
      transition: "opacity 0s",
    },
  },
]);

export const closeButton = style([backButton]);

export const center = style([f.flexAlignCenter, f.flex1, appBarMinHeight]);

export const centerMain = recipe({
  base: {
    width: vars.appBar.center.mainWidth,
    color: globalVars.appBar.textColor,
    transition: `height ${globalVars.appBar.heightTransitionDuration}`,
    selectors: {
      [`
        ${android} &,
        ${rootAndroid} &
      `]: {
        width: "100%",
        justifyContent: "flex-start",
        paddingLeft: "1rem",
        fontSize: "1.1875rem",
        lineHeight: "1.5",
        fontWeight: "bold",
        boxSizing: "border-box",
      },
      [`
        ${cupertino} &,
        ${rootCupertino} &
      `]: {
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
        top: ["constant(safe-area-inset-top)", "env(safe-area-inset-top)"],
      },
    },
  },
  variants: {
    hasLeft: {
      true: {
        selectors: {
          [`
            ${android} &,
            ${rootAndroid} &
          `]: {
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
      [`
        ${cupertino} &,
        ${rootCupertino} &
      `]: {
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
      [`
        ${android} &,
        ${rootAndroid} &
      `]: {
        padding: "0 0.5rem 0 0",
      },
    },
  },
]);
