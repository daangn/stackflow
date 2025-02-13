import { style } from "@vanilla-extract/css";

export const header = style({
  display: "flex",
  alignItems: "center",
  backgroundColor: "#1f2937",
  padding: "1rem",
});

export const tabs = style({
  display: "flex",
  flexDirection: "column",
  padding: "1rem",
});

export const leftContents = style({
  flex: "1 1 auto",
  display: "flex",
});

export const rightContents = style({
  flex: "0 0",
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
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
