import { style } from "@vanilla-extract/css";

export const container = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  flex: "1 1",
  height: "100%",
});

export const headerContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: "0 0",
});

export const tabContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: "1 1",
  minHeight: "0",
});
