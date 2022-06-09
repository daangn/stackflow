import { createTheme, createThemeContract, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";
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
    textColor: null,
    iconColor: null,
    center: {
      mainWidth: null,
    },
  },
});

const dimBackgroundColor = style({
  backgroundColor: vars.dimBackgroundColor,
});

export const background = style({
  backgroundColor: vars.backgroundColor,
});

export const allTransitions = style({
  transition: `transform ${vars.transitionDuration}, opacity ${vars.transitionDuration}`,
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
    iconColor: "#212124",
    textColor: "#212124",
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
    iconColor: "#212124",
    textColor: "#212124",
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
  allTransitions,
  {
    opacity: 0,
    selectors: {
      [`${cupertino} &`]: {
        zIndex: vars.zIndexes.dim,
      },
      [`${android} &`]: {
        height: "10rem",
        background: `linear-gradient(${vars.dimBackgroundColor}, rgba(0, 0, 0, 0))`,
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
      selectors: {
        [`${cupertino} &`]: {
          transform: "translateX(100%)",
          zIndex: vars.zIndexes.paper,
        },
        [`${cupertino}${enterActive} &`]: {
          transform: "translateX(0)",
        },
        [`${cupertino}${enterDone} &`]: {
          transform: "translateX(0)",
        },
        [`${android} &`]: {
          opacity: 0,
          transform: "translateY(10rem)",
        },
        [`${android}${enterActive} &`]: {
          opacity: 1,
          transform: "translateY(0)",
        },
        [`${android}${enterDone} &`]: {
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
            `calc(${vars.appBar.height} + constant(safe-area-inset-top))`,
            `calc(${vars.appBar.height} + env(safe-area-inset-top))`,
          ],
        },
      ],
    },
    isActiveTop: {
      false: {
        selectors: {
          [`${cupertino}${enterActive} &`]: {
            transform: "translateX(-5rem)",
          },
          [`${cupertino}${enterDone} &`]: {
            transform: "translateX(-5rem)",
          },
          [`${android}${enterActive} &`]: {
            transform: "translateY(-2rem)",
          },
          [`${android}${enterDone} &`]: {
            transform: "translateY(-2rem)",
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
    },
  ],
  variants: {
    hasAppBar: {
      true: {
        top: vars.appBar.height,
        height: calc("100%").subtract(vars.appBar.height).toString(),
      },
    },
  },
});

export { vars };
