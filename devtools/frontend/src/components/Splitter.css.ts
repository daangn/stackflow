import { style } from "@vanilla-extract/css";

export const divider = style({
  userSelect: "none",
  //cursor: "row-resize",
  backgroundColor: "gray",
  display: "flex",
  flex: "0 0 10px",
  ":hover": {
    backgroundColor: "lightgray",
  },
  // gradient like 3d
  backgroundImage:
    "linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1) 2px, transparent 1px, transparent 100%)",
});

export const horizontal = style({
  cursor: "row-resize",
});

export const vertical = style({
  cursor: "col-resize",
});
