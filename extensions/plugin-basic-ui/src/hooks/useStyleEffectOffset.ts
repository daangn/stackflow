/* eslint-disable no-param-reassign */

import { globalVars } from "../basicUIPlugin.css";
import { listenOnce, noop, requestNextFrame } from "../utils";
import { useStyleEffect } from "./useStyleEffect";

export const OFFSET_PX_ANDROID = 32;
export const OFFSET_PX_CUPERTINO = 80;

export function useStyleEffectOffset({
  refs,
  theme,
  activityEnterStyle,
  hasEffect = false,
}: {
  refs: Array<React.RefObject<any>>;
  theme: "android" | "cupertino";
  activityEnterStyle?: "slideInLeft";
  hasEffect?: boolean;
}) {
  useStyleEffect({
    styleName: "offset",
    refs,
    effect: hasEffect
      ? ({ activityTransitionState, refs }) => {
          let transform: string;
          let opacity: string;

          switch (theme) {
            case "cupertino": {
              transform = `translate3d(-${OFFSET_PX_CUPERTINO / 16}rem, 0, 0)`;
              opacity = "1";
              break;
            }
            case "android":
            default: {
              transform =
                activityEnterStyle === "slideInLeft"
                  ? `translate3d(-50%, 0, 0)`
                  : `translate3d(0, -${OFFSET_PX_ANDROID / 16}rem, 0)`;
              opacity = activityEnterStyle === "slideInLeft" ? "0" : "1";
              break;
            }
          }

          const cleanup = () => {
            requestNextFrame(() => {
              refs.forEach((ref) => {
                if (!ref.current) {
                  return;
                }

                const $el = ref.current;

                $el.style.transform = "";
                $el.style.opacity = "";

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

                ref.current.style.transition =
                  globalVars.computedTransitionDuration;
                ref.current.style.transform = transform;
                ref.current.style.opacity = opacity;
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
