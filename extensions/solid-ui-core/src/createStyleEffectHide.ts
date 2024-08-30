import type { Accessor } from "solid-js";
import { onCleanup } from "solid-js";

import { createStyleEffect } from "./createStyleEffect";
import { requestNextFrame } from "./utils";

export function createStyleEffectHide({
  refs,
}: {
  refs: Array<Accessor<any>>;
}) {
  createStyleEffect({
    styleName: "hide",
    refs,
    effect: ({ activityTransitionState, refs }) => {
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
          requestNextFrame(() => {
            refs.forEach((ref) => {
              const $el = ref();
              if (!$el) {
                return;
              }

              $el.style.display = "none";
            });
          });

          onCleanup(cleanup);
          break;
        }
        default: {
          cleanup();
        }
      }
    },
  });
}
