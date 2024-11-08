import { vars } from "@seed-design/design-token";
import { style } from "@vanilla-extract/css";

import { f } from "../styles";

export const container = style([f.resetButton, f.cursorPointer]);

export const thumbnail = style([
  f.posRel,
  {
    paddingBottom: "75%",
    marginBottom: ".5rem",
  },
]);

export const innerImage = style([
  f.posAbsFull,
  f.overflowHidden,
  {
    borderRadius: ".375rem",
    backgroundColor: vars.$scale.color.gray100,
  },
]);

export const title = style({
  fontSize: ".875rem",
  lineHeight: "1.25rem",
});

export const price = style({
  fontSize: ".875rem",
  fontWeight: "bold",
  lineHeight: "1.25rem",
});
