import { vars } from "@seed-design/design-token";
import { style } from "@vanilla-extract/css";

import { f } from "../styles";

export const container = style([
  f.posAbsFull,
  f.overflowScroll,
  f.rootLineHeight,
]);

export const image = style([
  f.posRel,
  {
    width: "100%",
    height: 0,
    paddingBottom: "100%",
    background: vars.$scale.color.gray100,
  },
]);

export const imageInner = style([f.posAbsFull]);

export const content = style({
  margin: "1.5rem 1rem 0",
  paddingBottom: "0.25rem",
  boxShadow: `0 1px 0 0 ${vars.$semantic.color.divider1}`,
});

export const title = style({
  fontSize: "1.25rem",
  fontWeight: "bold",
  marginBottom: ".625rem",
});

export const subtitle = style({
  fontSize: ".8125rem",
  color: vars.$scale.color.gray600,
  marginBottom: "1rem",
});

export const body = style({
  fontSize: "1rem",
  lineHeight: "1.375rem",
  marginBottom: "1.25rem",
});

export const section = style({
  boxShadow: `0 1px 0 0 ${vars.$semantic.color.divider1}`,
  ":last-child": {
    boxShadow: "none",
  },
});

export const sectionTitle = style({
  padding: "1.25rem 1rem",
  fontSize: "1rem",
  fontWeight: "bold",
});

export const recommenderGrid = style([
  f.grid,
  {
    gridTemplateColumns: "1fr 1fr",
    padding: ".25rem 1rem 1rem",
    gap: "1.25rem",
  },
]);
