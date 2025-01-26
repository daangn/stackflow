import { style } from "@vanilla-extract/css";

export const divider = style({
  userSelect: "none",
  backgroundColor: "#414141",
  display: "flex",
  flex: "0 0 4px",
  backgroundClip: "padding-box",
  boxSizing: "border-box",
  transition:
    "background-color 0.3s ease-in-out, border-color 0.3s ease-in-out",
  ":hover": {
    backgroundColor: "lightgray",
    borderColor: "lightgray",
  },
});

export const horizontal = style({
  cursor: "row-resize",
  borderTop: "1px solid transparent",
  borderBottom: "1px solid transparent",
});

export const vertical = style({
  cursor: "col-resize",
  borderLeft: "1px solid transparent",
  borderRight: "1px solid transparent",
});
