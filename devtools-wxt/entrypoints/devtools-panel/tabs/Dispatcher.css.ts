import { style } from "@vanilla-extract/css";

export const dispatcher = style({
  padding: "1rem",
});

export const items = style({
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
});

export const actions = style({
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
});

export const select = style({
  // appearance: "none",
  background: "#f7f7f7",
  border: "none",
  borderRadius: "0.5rem",
  color: "#444",
  fontSize: "1rem",
  padding: "0.5rem",
  // margin: "1rem",
  // width: "20rem",
  boxShadow: "0 0 1rem rgba(0, 0, 0, 0.1)",
  ":focus": {
    outline: "none",
    boxShadow: "0 0 1rem rgba(0, 0, 0, 0.2)",
  },
});

export const option = style({
  backgroundColor: "#f7f7f7",
  color: "#444",
  fontSize: "1rem",
  padding: "1rem",
  ":checked": {
    backgroundColor: "#337ab7",
    color: "#fff",
  },
});
