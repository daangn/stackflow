import type { Accessor } from "solid-js";
import { onCleanup } from "solid-js";

import { globalVars } from "../../common/basicUIPlugin.css";
import { listenOnce, requestNextFrame } from "../../common/utils";
import { createStyleEffect } from "./createStyleEffect";

export const OFFSET_PX_ANDROID = 32;
export const OFFSET_PX_CUPERTINO = 80;

export function createStyleEffectOffset({
  refs,
  theme,
  activityEnterStyle,
  hasEffect = false,
}: {
  refs: Array<Accessor<any>>;
  theme: "android" | "cupertino";
  activityEnterStyle?: "slideInLeft";
  hasEffect?: boolean;
}) {
  createStyleEffect({
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
            default: {
              transform =
                activityEnterStyle === "slideInLeft"
                  ? "translate3d(-50%, 0, 0)"
                  : `translate3d(0, -${OFFSET_PX_ANDROID / 16}rem, 0)`;
              opacity = activityEnterStyle === "slideInLeft" ? "0" : "1";
              break;
            }
          }

          const cleanup = () => {
            requestNextFrame(() => {
              refs.forEach((ref) => {
                const $el = ref();
                if (!$el) {
                  return;
                }

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
                const $el = ref();
                if (!$el) {
                  return;
                }

                $el.style.transition = globalVars.computedTransitionDuration;
                $el.style.transform = transform;
                $el.style.opacity = opacity;
              });

              switch (activityTransitionState) {
                case "enter-done":
                  onCleanup(cleanup);
                  return;
                default:
                  return;
              }
            }
            case "exit-active":
            case "exit-done": {
              requestNextFrame(() => {
                cleanup();
              });
              break;
            }
            default:
          }
        }
      : undefined,
  });
}
