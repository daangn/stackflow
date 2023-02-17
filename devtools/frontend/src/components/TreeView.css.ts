import { style } from "@vanilla-extract/css";

export const container = style({
  display: "flex",
  alignItems: "flex-start",
});

const transition = style({
  transitionProperty: "transform",
  transitionDuration: "0.1s",
  "@media": {
    "(prefers-color-scheme: dark)": {
      filter: "invert(1)",
    },
  },
});

export const rotateBefore = transition;

export const rotate = style([transition, { transform: "rotate(90deg)" }]);

export const branch = style({
  display: "flex",
  //alignItems: "center",
  padding: "7px 0",
  //marginTop: "1px",
  marginRight: "6px",
  marginLeft: "2px",
});

export const string = style({
  color: "#30a2a6",
  "::after": {
    content: "'\\0022'",
  },
  "::before": {
    content: "'\\0022'",
  },
});

export const notString = style({
  color: "#9d7fe3",
});
