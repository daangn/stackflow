import { useStack } from "@stackflow/react";
import { useEffect } from "react";

export function usePreventTouchDuringTransition({
  appScreenRef,
}: {
  appScreenRef: React.RefObject<HTMLDivElement>;
}) {
  const { globalTransitionState } = useStack();

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
