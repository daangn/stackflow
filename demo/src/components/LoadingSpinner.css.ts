import { style, keyframes } from "@vanilla-extract/css";

const spin = keyframes({
  "0%": { transform: "rotate(0deg)" },
  "100%": { transform: "rotate(360deg)" },
});

export const spinner = style({
  width: 48,
  height: 48,
  border: "4px solid #ccc",
  borderTop: "4px solid #333",
  borderRadius: "50%",
  animation: `${spin} 1s linear infinite`,
});