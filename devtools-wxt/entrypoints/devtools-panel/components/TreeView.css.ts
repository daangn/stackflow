import { style, keyframes } from "@vanilla-extract/css";

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
  height: "0.625rem",
  width: "0.625rem",
});

export const expand = style({
  padding: "0.5rem 0.3125rem 0.375rem 0",
  display: "flex",
  cursor: "pointer",
  "@media": {
    "(prefers-color-scheme: dark)": {
      filter: "invert(1)",
    },
  },
});

export const rotateBefore = transition;

export const rotate = style([transition, { transform: "rotate(90deg)" }]);

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

const updatedKeyframes = {
  "0%": {
    backgroundColor: "darkcyan",
    color: "white",
  },
  "100%": {
    backgroundColor: "transparent",
    color: "calc(inherit)",
  },
};

const updatedAnimation = keyframes(updatedKeyframes);
// same animation
const updatedAnimationSecond = keyframes(updatedKeyframes);

export const updated = style({
  animationName: updatedAnimation,
  animationDuration: "1s",
});

export const updatedAgain = style({
  animationName: updatedAnimationSecond,
  animationDuration: "1s",
});
