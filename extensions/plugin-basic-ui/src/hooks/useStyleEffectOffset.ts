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

                ref.current.style.transition = `var(--stackflow-transition-duration)`;
                ref.current.style.transform = transform;
              });

              switch (activityTransitionState) {
                case "enter-done":
                  return () => {
                    cleanup();
                  };
                case "enter-active":
                default:
                  return () => {};
              }
            }
            case "exit-active":
            case "exit-done": {
              requestNextFrame(() => {
                cleanup();
              });

              return () => {};
            }
            default: {
              return () => {};
            }
          }
        }
      : undefined,
  });
}
