/* eslint-disable no-param-reassign */

import { noop } from "../utils";
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
          const cleanup = () => {
            refs.forEach((ref) => {
              if (!ref.current) {
                return;
              }
              const $ref = ref.current;

              $ref.style.display = "";
            });
          };

          switch (activityTransitionState) {
            case "enter-done": {
              refs.forEach((ref) => {
                if (!ref.current) {
                  return;
                }
                const $ref = ref.current;

                $ref.style.display = "none";
              });

              return () => {
                cleanup();
              };
            }
            default: {
              cleanup();

              return noop;
            }
          }
        }
      : undefined,
  });
}
