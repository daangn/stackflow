import { vars } from "@seed-design/design-token";
import { style } from "@vanilla-extract/css";

import { f } from "../styles";

export const container = style([
  f.grid,
  {
    gridTemplateColumns: "1.5rem 1.5rem 1.5rem 1.5rem 1.5rem",
    justifyContent: "space-between",
    padding: ".5rem 7.25% 0",
    paddingBottom: [
      "calc(.375rem + constant(safe-area-inset-bottom))",
      "calc(.375rem + env(safe-area-inset-bottom))",
    ],
    boxShadow: `0 -1px 0 0 ${vars.$semantic.color.divider2}`,
  },
]);

export const button = style([
  f.flexColumn,
  f.flexAlignCenter,
  f.resetButton,
  f.cursorPointer,
]);

export const buttonIcon = style([
  {
    marginBottom: ".375rem",
  },
]);

export const buttonLabel = style([
  f.nowrap,
  {
    fontSize: ".75rem",
  },
]);
