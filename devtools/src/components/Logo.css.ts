import { style } from "@vanilla-extract/css";

export const logo = style({
  color: "#1f2937",
  backgroundColor: "white",
  padding: "0.25rem 0.5rem",
  borderRadius: "0.5rem",
  "@media": {
    "(prefers-color-scheme: dark)": {
      filter: "invert(0)",
    },
  },
});

export const logoText = style({
  fontWeight: "bold",
  textAlign: "center",
  "@media": {
    "(prefers-color-scheme: dark)": {
      filter: "invert(0)",
    },
  },
});
