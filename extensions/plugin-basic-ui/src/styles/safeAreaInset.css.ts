import { globalStyle } from "@vanilla-extract/css";

const SIDES = ["top", "right", "bottom", "left"] as const;

type Side = (typeof SIDES)[number];

const property = (side: Side) =>
  `--stackflow-plugin-basic-ui-safe-area-inset-${side}`;

export const safeAreaInset = Object.fromEntries(
  SIDES.map((side) => [side, `var(${property(side)})`]),
) as Record<Side, string>;

const withFallback = (fallback: (side: Side) => string) =>
  Object.fromEntries(
    SIDES.map((side) => [
      property(side),
      `var(--native-safe-area-inset-${side}, ${fallback(side)})`,
    ]),
  );

globalStyle(":root", {
  vars: withFallback(() => "0px"),
  "@supports": {
    "(left: constant(safe-area-inset-left))": {
      vars: withFallback((side) => `constant(safe-area-inset-${side})`),
    },
    "(left: env(safe-area-inset-left))": {
      vars: withFallback((side) => `env(safe-area-inset-${side})`),
    },
  },
});
