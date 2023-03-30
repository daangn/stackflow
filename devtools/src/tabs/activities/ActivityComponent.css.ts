import { style } from "@vanilla-extract/css";

export const activity = style({
  border: "1px solid white",
  borderRadius: "0.5rem",
  padding: "0.5rem",
  textAlign: "center",
  // "@media": {
  //   "(prefers-color-scheme: dark)": {
  //     filter: "invert(1)",
  //   },
  // },
  ":hover": {
    cursor: "pointer",
  },
  //backgroundColor: "white",
  color: "white",
});

export const text = style({
  // "@media": {
  //   "(prefers-color-scheme: dark)": {
  //     filter: "invert(0)",
  //   },
  // },
});

export const top = style({
  color: "black",
  backgroundColor: "white",
  "@media": {
    "(prefers-color-scheme: dark)": {
      filter: "invert(0)",
    },
  },
});

export const exited = style({
  opacity: "0.5",
});
