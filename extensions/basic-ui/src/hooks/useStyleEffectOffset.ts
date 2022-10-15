/* eslint-disable no-param-reassign */

import { listenOnce, requestNextFrame } from "../utils";
import { useStyleEffect } from "./useStyleEffect";

export const OFFSET_PX_ANDROID = 32;
export const OFFSET_PX_CUPERTINO = 80;

export function useStyleEffectOffset({
  refs,
  theme,
  hasEffect,
}: {
  refs: Array<React.RefObject<any>>;
  theme: "android" | "cupertino";
  hasEffect?: boolean;
}) {
  useStyleEffect({
    styleName: "offset",
    refs,
    effect: hasEffect
      ? ({ activityTransitionState, refs }) => {
          const transform =
            theme === "cupertino"
              ? `translateX(-${OFFSET_PX_CUPERTINO / 16}rem)`
              : `translateY(-${OFFSET_PX_ANDROID / 16}rem)`;

          switch (activityTransitionState) {
            case "enter-active":
            case "enter-done": {
              refs.forEach((ref) => {
                ref.current.style.transition = `transform var(--stackflow-transition-duration)`;
                ref.current.style.transform = transform;
              });
              break;
            }
            case "exit-active":
            case "exit-done": {
              requestNextFrame(() => {
                refs.forEach((ref) => {
                  ref.current.style.transform = "";

                  listenOnce(ref.current, "transitionend", () => {
                    ref.current.style.transition = "";
                  });
                });
              });
              break;
            }
            default: {
              break;
            }
          }
        }
      : undefined,
  });
}
