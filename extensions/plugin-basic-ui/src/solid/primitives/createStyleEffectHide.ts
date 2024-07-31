import type { Accessor } from "solid-js";
import { onCleanup } from "solid-js";

import { createStyleEffect } from "./createStyleEffect";

export function createStyleEffectHide({
  refs,
  hasEffect,
}: {
  refs: Array<Accessor<any>>;
  hasEffect?: boolean;
}) {
  createStyleEffect({
    styleName: "hide",
    refs,
    effect: hasEffect
      ? ({ activityTransitionState, refs }) => {
          const cleanup = () => {
            refs.forEach((ref) => {
              const $el = ref();
              if (!$el) {
                return;
              }

              $el.style.display = "";
            });
          };

          switch (activityTransitionState) {
            case "enter-done": {
              refs.forEach((ref) => {
                const $el = ref();
                if (!$el) {
                  return;
                }

                $el.style.display = "none";
              });

              onCleanup(cleanup);
              break;
            }
            default: {
              cleanup();
            }
          }
        }
      : undefined,
  });
}
