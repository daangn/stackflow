import { style } from "@vanilla-extract/css";

export const sidebar = style({
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#1f2937",
  padding: "1rem",
});

export const tabs = style({
  display: "flex",
  flexDirection: "column",
  padding: "1rem",
});

export const topContent = style({
  flex: "1 1 auto",
});

export const footer = style({
  flex: "0 0",
  color: "white",
});

export const button = style({
  padding: "0.5rem 1rem",
  backgroundColor: "transparent",
  borderRadius: "1rem",
  border: "none",
  color: "white",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  ":hover": {
    backgroundColor: "#e5e7eb",
  },
});

export const buttonActive = style([
  button,
  {
    backgroundColor: "#111827",
    color: "white",
  },
]);
