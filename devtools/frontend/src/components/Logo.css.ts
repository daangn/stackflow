import { style } from "@vanilla-extract/css";

export const logo = style({
  backgroundColor: "white",
  padding: "0.25rem 0.5rem",
  borderRadius: "0.5rem",
});

export const logoText = style({
  fontWeight: "bold",
  textAlign: "center",
  "@media": {
    "(prefers-color-scheme: dark)": {
      filter: "invert(1)",
    },
  },
});
