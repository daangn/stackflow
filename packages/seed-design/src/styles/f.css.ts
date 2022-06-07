import { style } from "@vanilla-extract/css";

export const posAbs = style({
  position: "absolute",
});

export const posAbsFull = style([
  posAbs,
  {
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
]);

export const flex = style({
  display: "flex",
});

export const flexAlignCenter = style([
  flex,
  {
    alignItems: "center",
  },
]);
