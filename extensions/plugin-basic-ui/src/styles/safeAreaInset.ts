const inset = (side: "top" | "right" | "bottom" | "left") =>
  `var(--native-safe-area-inset-${side}, env(safe-area-inset-${side}, 0px))`;

export const safeAreaInset = {
  top: inset("top"),
  right: inset("right"),
  bottom: inset("bottom"),
  left: inset("left"),
};
