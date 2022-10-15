/* eslint-disable no-param-reassign */

import { useStyleEffect } from "./useStyleEffect";

export function useStyleEffectHide({
  refs,
}: {
  refs: Array<React.RefObject<any>>;
}) {
  useStyleEffect({
    styleName: "hide",
    refs,
    effect({ activityTransitionState, refs }) {
      switch (activityTransitionState) {
        case "enter-done": {
          refs.forEach((ref) => {
            ref.current.style.display = "none";
          });
          break;
        }
        default: {
          refs.forEach((ref) => {
            ref.current.style.display = "";
          });
          break;
        }
      }
    },
  });
}
