import { globalStyle, style } from "@vanilla-extract/css";

globalStyle("html, body, #root", {
  height: "100%",
  fontFamily: "sans-serif",
});

export const container = style({
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  position: "absolute",
});
