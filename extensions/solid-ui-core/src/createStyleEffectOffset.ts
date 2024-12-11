import type { Accessor } from "solid-js";
import { onCleanup } from "solid-js";

import { createStyleEffect } from "./createStyleEffect";
import { listenOnce, requestNextFrame } from "./utils";

export function createStyleEffectOffset({
  refs,
  transitionDuration,
  offsetStyles,
  hasEffect = false,
}: {
  refs: Array<Accessor<any>>;
  transitionDuration: string;
  offsetStyles: {
    transform: string;
    opacity: string;
  };
  hasEffect?: boolean;
}) {
  createStyleEffect({
    styleName: "offset",
    refs,
    effect: hasEffect
      ? ({ activityTransitionState, refs }) => {
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
              requestNextFrame(() => {
                refs.forEach((ref) => {
                  const $el = ref();
                  if (!$el) {
                    return;
                  }

                  $el.style.transition = transitionDuration;
                  $el.style.transform = offsetStyles.transform;
                  $el.style.opacity = offsetStyles.opacity;
                });
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
