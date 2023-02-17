import { style } from "@vanilla-extract/css";

export const container = style({
  display: "flex",
  alignItems: "stretch",
  width: "100vw",
});

export const sideBarContainer = style({
  display: "flex",
  flex: "0 0 auto",
});

export const tabContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: "1 1",
});
