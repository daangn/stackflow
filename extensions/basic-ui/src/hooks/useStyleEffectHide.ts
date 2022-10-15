/* eslint-disable no-param-reassign */

import { useStyleEffect } from "./useStyleEffect";

export function useStyleEffectHide({
  refs,
  hasEffect,
}: {
  refs: Array<React.RefObject<any>>;
  hasEffect?: boolean;
}) {
  useStyleEffect({
    styleName: "hide",
    refs,
    effect: hasEffect
      ? ({ activityTransitionState, refs }) => {
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
        }
      : undefined,
  });
}
