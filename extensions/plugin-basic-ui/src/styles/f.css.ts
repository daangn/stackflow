import { style } from "@vanilla-extract/css";

export const fullWidth = style({
  width: "100%",
});

export const fullHeight = style({
  height: "100%",
});

export const top0 = style({
  top: 0,
});

export const left0 = style({
  left: 0,
});

export const posAbs = style({
  position: "absolute",
});

export const posRel = style({
  position: "relative",
});

export const posAbsFull = style([posAbs, fullWidth, fullHeight, top0, left0]);

export const flex = style({
  display: "flex",
});

export const flex1 = style({
  flex: 1,
});

export const flexAlignCenter = style([
  flex,
  {
    alignItems: "center",
  },
]);

export const flexAlignEnd = style([
  flex,
  {
    alignItems: "flex-end",
  },
]);

export const flexJustifyCenter = style([
  flex,
  {
    justifyContent: "center",
  },
]);

export const overflowHidden = style({
  overflow: "hidden",
});

export const whiteSpaceNowrap = style({
  whiteSpace: "nowrap",
});

export const textAlignCenter = style({
  textAlign: "center",
});

export const cursorPointer = style({
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
});

export const borderBox = style({
  boxSizing: "border-box",
});

export const contentBox = style({
  boxSizing: "content-box",
});

export const resetButton = style({
  appearance: "none",
  border: 0,
  padding: 0,
  background: "none",
});
