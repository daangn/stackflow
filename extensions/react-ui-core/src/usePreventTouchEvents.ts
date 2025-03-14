import { useStack } from "@stackflow/react";
import { useEffect } from "react";

export function usePreventTouchEvents({
  appScreenRef,
}: {
  appScreenRef: React.RefObject<HTMLDivElement>;
}) {
  const { globalTransitionState } = useStack();

  useEffect(() => {
    const $appScreen = appScreenRef.current;
    if (!$appScreen) {
      return;
    }

    if (globalTransitionState === "idle") {
      return;
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
    };

    $appScreen.addEventListener("touchstart", onTouchStart);
    $appScreen.addEventListener("touchend", onTouchEnd);

    return () => {
      $appScreen.removeEventListener("touchstart", onTouchStart);
      $appScreen.removeEventListener("touchend", onTouchEnd);
    };
  }, [globalTransitionState]);
}
