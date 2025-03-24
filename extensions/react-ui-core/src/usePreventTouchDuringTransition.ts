import { useEffect } from "react";
import { useNullableStack } from "./useNullableStack";

export function usePreventTouchDuringTransition({
  appScreenRef,
}: {
  appScreenRef: React.RefObject<HTMLDivElement>;
}) {
  const stack = useNullableStack();

  useEffect(() => {
    if (!stack) {
      return;
    }

    const $appScreen = appScreenRef.current;
    if (!$appScreen || stack.globalTransitionState === "idle") {
      return;
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
    };

    $appScreen.addEventListener("touchstart", onTouchStart);

    return () => {
      $appScreen.removeEventListener("touchstart", onTouchStart);
    };
  }, [stack?.globalTransitionState]);
}
