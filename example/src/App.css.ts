import { globalStyle, style } from "@vanilla-extract/css";

globalStyle("html, body, #root", {
  height: "100%",
  fontFamily: "sans-serif",
});

export const container = style({
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#eee",
});

export const centered = style({
  maxWidth: "22.5rem",
  maxHeight: "40rem",
  width: "100%",
  height: "100%",
  position: "relative",
  backgroundColor: "#fff",
  borderRadius: ".5rem",
  overflow: "hidden",
});
