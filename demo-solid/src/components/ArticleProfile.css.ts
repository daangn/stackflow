import { vars } from "@seed-design/design-token";
import { style } from "@vanilla-extract/css";

import { f } from "../styles";

export const container = style([
  f.flexAlignCenter,
  {
    margin: "1rem 1rem 0",
    paddingBottom: "1rem",
    boxShadow: `0 1px 0 0 ${vars.$semantic.color.divider1}`,
  },
]);

export const avatar = style([
  f.overflowHidden,
  {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "50%",
    backgroundColor: vars.$scale.color.gray100,
    marginRight: ".75rem",
  },
]);

export const labels = style([f.flex1]);

export const name = style({
  fontSize: "1rem",
  fontWeight: "bold",
  marginBottom: ".25rem",
});

export const region = style({
  fontSize: ".8125rem",
  color: vars.$scale.color.gray700,
});

export const rating = style({
  textAlign: "right",
  margin: "-.375rem 0",
});

export const ratingImg = style({
  marginBottom: ".125rem",
  color: vars.$scale.color.gray200,
});

export const ratingCaption = style({
  textDecoration: "underline",
  color: vars.$scale.color.gray600,
  fontSize: ".75rem",
});
