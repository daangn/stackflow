import { useEffect } from "react";
import { useNullableStack } from "./useNullableStack";

export function usePreventTouchDuringTransition({
  ref,
}: {
  ref: React.RefObject<HTMLDivElement>;
}) {
  const stack = useNullableStack();

  useEffect(() => {
    if (!stack) {
      return;
    }

    const $ref = ref.current;
    if (!$ref || stack.globalTransitionState === "idle") {
      return;
    }

    const preventTouch = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Use capture phase to prevent all touch events from reaching child elements
    // during transitions (including edge swipe area)
    $ref.addEventListener("touchstart", preventTouch, { capture: true });
    $ref.addEventListener("touchmove", preventTouch, { capture: true });
    $ref.addEventListener("touchend", preventTouch, { capture: true });
    $ref.addEventListener("touchcancel", preventTouch, { capture: true });

    return () => {
      $ref.removeEventListener("touchstart", preventTouch, { capture: true });
      $ref.removeEventListener("touchmove", preventTouch, { capture: true });
      $ref.removeEventListener("touchend", preventTouch, { capture: true });
      $ref.removeEventListener("touchcancel", preventTouch, { capture: true });
    };
  }, [stack?.globalTransitionState]);
}
