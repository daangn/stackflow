import { style } from "@vanilla-extract/css";

export const input = style({
  display: "block",
  // width: "100%",
  padding: "0.75rem 1rem",
  border: "0.0625rem solid gray",
  color: "white",
  // backgroundColor: "#f2f2f2",
  backgroundColor: "#333333",
  fontSize: "1rem",
  borderRadius: "0.5rem",
  transition: "border 0.1s ease-in-out",
  ":focus": {
    outline: "none",
    border: "0.0625rem solid cornflowerblue",
  },
  "@media": {
    "(prefers-color-scheme: dark)": {
      color: "#ffffff",
    },
  },
});
