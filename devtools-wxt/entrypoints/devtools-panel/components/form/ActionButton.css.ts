import { style } from "@vanilla-extract/css";

export const button = style({
  display: "inline-block",
  padding: "0.5rem 1rem",
  border: "none",
  backgroundColor: "#f57c00",
  color: "#ffffff",
  fontSize: "1rem",
  fontWeight: "bold",
  textAlign: "center",
  textDecoration: "none",
  textTransform: "uppercase",
  borderRadius: "0.5rem",
  // boxShadow: "0 0.1875rem 0.1875rem rgba(0, 0, 0, 0.3)",
  transition: "background-color 0.1s ease-in-out",
  cursor: "pointer",
  ":hover": {
    backgroundColor: "#ff9800",
  },
});
