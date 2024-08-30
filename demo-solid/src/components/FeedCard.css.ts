import { vars } from "@seed-design/design-token";
import { style } from "@vanilla-extract/css";

import { f } from "../styles";

export const container = style([
  f.flex,
  {
    padding: "1rem 1rem 0",
  },
]);

export const button = style([
  f.cursorPointer,
  f.resetButton,
  f.flex,
  {
    boxShadow: `0 1px 0 0 ${vars.$semantic.color.divider1}`,
    paddingBottom: "1rem",
    width: "100%",
  },
]);

export const thumbnail = style([
  f.overflowHidden,
  {
    width: "6.75rem",
    height: "6.75rem",
    backgroundColor: vars.$scale.color.gray100,
    borderRadius: ".375rem",
    marginRight: "1rem",
    backgroundSize: "cover",
    backgroundPosition: "50% 50%",
  },
]);

export const right = style([f.flex1]);

export const title = style([
  {
    fontSize: "1rem",
    lineHeight: "1.375rem",
  },
]);

export const subtitle = style([
  {
    fontSize: ".8125rem",
    lineHeight: "1.25rem",
    color: vars.$scale.color.gray600,
  },
]);

export const price = style({
  fontSize: ".875rem",
  fontWeight: "bold",
  lineHeight: "1.25rem",
});
