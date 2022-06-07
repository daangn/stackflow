import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

import { f } from "./styles";

export const card = recipe({
  base: [f.posAbs],
  variants: {
    transitionState: {
      enter: {},
      "enter-active": {},
      "enter-done": {},
      "exit-active": {},
      "exit-done": {},
    },
  },
});
