import {
  createGlobalThemeContract,
  createTheme,
  style,
} from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";
import { recipe } from "@vanilla-extract/recipes";

import { f } from "./styles";

const vars = createGlobalThemeContract(
  {
    backgroundColor: null,
    dimBackgroundColor: null,
    transitionDuration: null,
    zIndexes: {
      paper: null,
      appBar: null,
    },
    appBar: {
      height: null,
      borderColor: null,
      borderSize: null,
      center: {
        mainWidth: null,
      },
    },
  },
  (_, path) => `stackflow-seed-design-${path.join("-")}`,
);

const dimBackgroundColor = style({
  backgroundColor: vars.dimBackgroundColor,
});

const background = style({
  backgroundColor: vars.backgroundColor,
});

const opacityTransition = style({
  transition: `opacity ${vars.transitionDuration}`,
});

const transformTransition = style({
  transition: `transform ${vars.transitionDuration}`,
});

const android = createTheme(vars, {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  transitionDuration: "",
  zIndexes: {
    paper: "",
    appBar: "",
  },
  appBar: {
    height: "3.5rem",
    borderColor: "rgba(0, 0, 0, 0.07)",
    borderSize: "1px",
    center: {
      mainWidth: "",
    },
  },
});

const cupertino = createTheme(vars, {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  transitionDuration: "",
  zIndexes: {
    paper: "",
    appBar: "",
  },
  appBar: {
    height: "2.75rem",
    borderColor: "rgba(0, 0, 0, 0.12)",
    borderSize: "0.5px",
    center: {
      mainWidth: "",
    },
  },
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
  display: "block",
  transform: "translateX(100%)",
});

export const appScreen = recipe({
  base: [f.posAbsFull, f.overflowHidden],
  variants: {
    theme: {
      android,
      cupertino,
    },
  },
});

export const dim = style([
  f.posAbsFull,
  dimBackgroundColor,
  opacityTransition,
  {
    opacity: 0,
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
      },
    },
  },
]);

export const appBar = style([
  f.posAbs,
  f.flexAlignCenter,
  f.fullWidth,
  background,
  {
    height: vars.appBar.height,
    boxShadow: `inset 0px ${calc(vars.appBar.borderSize).negate()} 0 ${
      vars.appBar.borderColor
    }`,
    zIndex: vars.zIndexes.appBar,
    selectors: {
      [`${exitActive} > &`]: {
        transform: "translateX(100%)",
      },
    },
  },
]);

export const appBarLeft = style([
  f.flexAlignCenter,
  f.fullHeight,
  {
    padding: "0 0.5rem",
    ":empty": {
      display: "none",
    },
  },
]);

export const appBarBackButton = style([
  f.flexAlignCenter,
  f.flexJustifyCenter,
  f.cursorPointer,
  {
    color: "#000",
    opacity: 1,
    transition: "opacity 300ms",
    width: "2.25rem",
    height: "2.75rem",
    textDecoration: "none",
    outline: "none",
    ":active": {
      opacity: "0.2",
      transition: "opacity 0s",
    },
  },
]);

export const appBarCenter = style([
  f.flexAlignCenter,
  {
    flex: 1,
  },
]);

export const appBarCenterMain = recipe({
  base: {
    width: vars.appBar.center.mainWidth,
  },
  variants: {
    theme: {
      android: [
        f.fullWidth,
        {
          justifyContent: "flex-start",
          paddingLeft: "1rem",
          fontSize: "1.1875rem",
          lineHeight: "1.5",
          fontWeight: "bold",
          boxSizing: "border-box",
        },
      ],
      cupertino: [
        f.textAlignCenter,
        f.flexAlignCenter,
        f.flexJustifyCenter,
        f.posAbs,
        f.fullHeight,
        f.top0,
        {
          fontFamily: "-apple-system, BlinkMacSystemFont",
          fontWeight: 600,
          fontSize: "1rem",
          left: "50%",
          transform: "translate(-50%)",
        },
      ],
    },
  },
});

export const appBarCenterMainText = style([
  f.overflowHidden,
  f.whiteSpaceNowrap,
  f.fullWidth,
  {
    textOverflow: "ellipsis",
    fontSize: "inherit",
    fontWeight: "inherit",
  },
]);

export const appBarRight = style([
  f.flexAlignCenter,
  f.fullHeight,
  f.posRel,
  {
    padding: "0 0.5rem",
    marginLeft: "auto",
    ":empty": {
      display: "none",
    },
    selectors: {
      [`${android} > &`]: {
        padding: "0 0.5rem 0 0",
      },
    },
  },
]);

export const paper = recipe({
  base: [
    f.posAbsFull,
    background,
    transformTransition,
    {
      transform: "translateX(100%)",
      overflowY: "scroll",
      zIndex: vars.zIndexes.paper,
      selectors: {
        [`${enterActive} > &`]: {
          transform: "translateX(0)",
        },
        [`${enterDone} > &`]: {
          transform: "translateX(0)",
        },
      },
    },
  ],
  variants: {
    hasAppBar: {
      true: [
        f.borderBox,
        {
          paddingTop: vars.appBar.height,
        },
      ],
      false: {},
    },
    isTop: {
      true: {},
      false: {
        selectors: {
          [`${enterActive} > &`]: {
            transform: "translateX(-5rem)",
          },
          [`${enterDone} > &`]: {
            transform: "translateX(-5rem)",
          },
        },
      },
    },
  },
});

export { vars };
