import type React from "react";
import { useEffect, useRef } from "react";

export function useForwardedRef<T>(
  ref: React.ForwardedRef<T>,
): React.RefObject<T> {
  const innerRef = useRef<T>(null);

  useEffect(() => {
    if (!ref) {
      return;
    }

    if (typeof ref === "function") {
      ref(innerRef.current);
      return;
    }

    // eslint-disable-next-line no-param-reassign
    ref.current = innerRef.current;
  }, [ref, innerRef]);

  return innerRef;
}
