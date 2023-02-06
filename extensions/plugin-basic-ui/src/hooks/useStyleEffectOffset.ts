/* eslint-disable no-param-reassign */

import { globalVars } from "../theme.css";
import { listenOnce, noop, requestNextFrame } from "../utils";
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
              ? `translate3d(-${OFFSET_PX_CUPERTINO / 16}rem, 0, 0)`
              : `translate3d(0, -${OFFSET_PX_ANDROID / 16}rem, 0)`;

          const cleanup = () => {
            requestNextFrame(() => {
              refs.forEach((ref) => {
                if (!ref.current) {
                  return;
                }

                const $el = ref.current;

                $el.style.transform = "";

                listenOnce($el, "transitionend", () => {
                  $el.style.transition = "";
                });
              });
            });
          };

          switch (activityTransitionState) {
            case "enter-active":
            case "enter-done": {
              refs.forEach((ref) => {
                if (!ref.current) {
                  return;
                }

                ref.current.style.transition = globalVars.transitionDuration;
                ref.current.style.transform = transform;
              });

              switch (activityTransitionState) {
                case "enter-done":
                  return () => {
                    cleanup();
                  };
                case "enter-active":
                default:
                  return noop;
              }
            }
            case "exit-active":
            case "exit-done": {
              requestNextFrame(() => {
                cleanup();
              });

              return noop;
            }
            default: {
              return noop;
            }
          }
        }
      : undefined,
  });
}
