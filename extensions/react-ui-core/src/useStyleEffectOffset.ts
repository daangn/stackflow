import { useStyleEffect } from "./useStyleEffect";
import { listenOnce, noop, requestNextFrame } from "./utils";

export function useStyleEffectOffset({
  refs,
  transitionDuration,
  offsetStyles,
  hasEffect = false,
}: {
  refs: Array<React.RefObject<any>>;
  transitionDuration: string;
  offsetStyles: {
    transform: string;
    opacity: string;
  };
  hasEffect?: boolean;
}) {
  useStyleEffect({
    styleName: "offset",
    refs,
    effect: hasEffect
      ? ({ activityTransitionState, refs }) => {
          const cleanup = () => {
            requestNextFrame(() => {
              refs.forEach((ref) => {
                if (!ref.current) {
                  return;
                }

                const $el = ref.current;

                $el.style.transform = "";
                $el.style.opacity = "";

                listenOnce($el, ["transitionend", "transitioncancel"], () => {
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

                ref.current.style.transition = transitionDuration;
                ref.current.style.transform = offsetStyles.transform;
                ref.current.style.opacity = offsetStyles.opacity;
              });

              switch (activityTransitionState) {
                case "enter-done":
                  return () => {
                    cleanup();
                  };
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
