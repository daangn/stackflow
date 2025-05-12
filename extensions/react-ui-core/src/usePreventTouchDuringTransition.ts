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
    };

    $ref.addEventListener("touchstart", onTouchStart);

    return () => {
      $ref.removeEventListener("touchstart", onTouchStart);
    };
  }, [stack?.globalTransitionState]);
}
