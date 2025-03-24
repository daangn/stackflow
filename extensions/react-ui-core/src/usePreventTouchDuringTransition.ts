import { useEffect } from "react";
import { useNullableStack } from "./useNullableStack";

export function usePreventTouchDuringTransition({
  appScreenRef,
}: {
  appScreenRef: React.RefObject<HTMLDivElement>;
}) {
  const stack = useNullableStack();

  if (!stack) {
    return;
  }

  const { globalTransitionState } = stack;

  useEffect(() => {
    const $appScreen = appScreenRef.current;
    if (!$appScreen || globalTransitionState === "idle") {
      return;
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
    };

    $appScreen.addEventListener("touchstart", onTouchStart);

    return () => {
      $appScreen.removeEventListener("touchstart", onTouchStart);
    };
  }, [globalTransitionState]);
}
