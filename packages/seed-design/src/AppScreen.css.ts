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
    transitionDuration: "",
    appBar: {
      height: "",
      borderColor: "rgba(0, 0, 0, 0.07)",
      borderSize: "1px",
      center: {
        mainWidth: "",
      },
    },
  },
  (_, path) => `stackflow-seed-design-${path.join("-")}`,
);

const android = createTheme(vars, {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  transitionDuration: "",
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
  appBar: {
    height: "2.75rem",
    borderColor: "rgba(0, 0, 0, 0.12)",
    borderSize: "0.5px",
    center: {
      mainWidth: "",
    },
  },
});

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
  base: [
    f.posAbsFull,
    {
      overflow: "hidden",
    },
  ],
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
  background,
  {
    width: "100%",
    height: vars.appBar.height,
    boxShadow: `inset 0px ${calc(vars.appBar.borderSize).negate()} 0 ${
      vars.appBar.borderColor
    }`,
  },
]);

export const appBarLeft = style([]);
export const appBarCenter = style([
  f.flexAlignCenter,
  {
    flex: 1,
  },
]);

export const appBarCenterMain = style([
  {
    width: vars.appBar.center.mainWidth,
    fontFamily: "-apple-system, BlinkMacSystemFont",
    textAlign: "center",
    fontWeight: 600,
    fontSize: "1rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "0",
    left: "50%",
    height: "100%",
    transform: "translate(-50%)",
  },
]);

export const appBarCenterMainText = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontSize: "inherit",
  fontWeight: "inherit",
  whiteSpace: "nowrap",
  width: "100%",
});

export const appBarRight = style([]);

export const paper = recipe({
  base: [
    f.posAbsFull,
    background,
    transformTransition,
    {
      transform: "translateX(100%)",
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
    isAppBar: {
      true: {
        paddingTop: vars.appBar.height,
      },
    },
  },
});

export { vars };
