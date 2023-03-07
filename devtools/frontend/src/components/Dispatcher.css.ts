import { style } from "@vanilla-extract/css";

export const input = style({
  outline: "none",
  border: "1px solid transparent",
  borderRadius: "4px",
  transition: "border 0.2s ease",
  padding: "0.5rem",
  ":focus": {
    border: "1px solid #85b7d9",
  },
});

export const label = style({
  display: "block",
  marginBottom: "0.5rem",
  fontWeight: "bold",
});

export const labelRequired = style({
  content: "*",
  color: "#db2828",
});

export const fieldTemplate = style({
  marginBottom: "1rem",
  display: "flex",
  flexDirection: "column",
});
