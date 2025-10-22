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

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Use capture phase to prevent touch events from reaching child elements
    // during transitions (including edge swipe area)
    $ref.addEventListener("touchstart", onTouchStart, { capture: true });
    $ref.addEventListener("touchend", onTouchEnd, { capture: true });

    return () => {
      $ref.removeEventListener("touchstart", onTouchStart, { capture: true });
      $ref.removeEventListener("touchend", onTouchEnd, { capture: true });
    };
  }, [stack?.globalTransitionState]);
}
