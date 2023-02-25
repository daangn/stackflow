import { style } from "@vanilla-extract/css";

export const divider = style({
  userSelect: "none",
  backgroundColor: "#414141",
  display: "flex",
  flex: "0 0 4px",
  ":hover": {
    backgroundColor: "lightgray",
  },
});

export const horizontal = style({
  cursor: "row-resize",
});

export const vertical = style({
  cursor: "col-resize",
});
