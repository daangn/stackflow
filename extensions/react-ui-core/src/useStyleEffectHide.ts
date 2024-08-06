import { useStyleEffect } from "./useStyleEffect";
import { noop } from "./utils";

export function useStyleEffectHide({
  refs,
}: {
  refs: Array<React.RefObject<any>>;
}) {
  useStyleEffect({
    styleName: "hide",
    refs,
    effect: ({ activityTransitionState, refs }) => {
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
    },
  });
}
