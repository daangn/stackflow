import { createTheme, createThemeContract, style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

import { f } from "./styles";

const vars = createThemeContract({
  backgroundColor: null,
  dimBackgroundColor: null,
  transitionDuration: null,
  zIndexes: {
    dim: null,
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
});

const dimBackgroundColor = style({
  backgroundColor: vars.dimBackgroundColor,
});

const opacityTransition = style({
  transition: `opacity ${vars.transitionDuration}`,
});

const transformTransition = style({
  transition: `transform ${vars.transitionDuration}`,
});

export const background = style({
  backgroundColor: vars.backgroundColor,
});

export const android = createTheme(vars, {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  transitionDuration: "",
  zIndexes: {
    dim: "",
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

export const cupertino = createTheme(vars, {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  transitionDuration: "",
  zIndexes: {
    dim: "",
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

export const enterActive = style({});
export const enterDone = style({});
export const exitActive = style({});
export const exitDone = style({
  transform: "translateX(100%)",
});

export const appScreen = recipe({
  base: [f.posAbsFull, f.overflowHidden],
  variants: {
    theme: {
      android,
      cupertino,
    },
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
  opacityTransition,
  {
    opacity: 0,
    zIndex: vars.zIndexes.dim,
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
    },
    isActiveTop: {
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
    isVisibleTop: {
      true: {
        selectors: {
          [`${enterDone} > &`]: {
            transition: "0s",
          },
        },
      },
    },
  },
});

export { vars };
