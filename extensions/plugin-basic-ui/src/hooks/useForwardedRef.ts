import type React from "react";
import { useImperativeHandle, useRef } from "react";

export function useForwardedRef<T>(
  ref: React.ForwardedRef<T>,
): React.RefObject<T> {
  const innerRef = useRef<T>(null);
  useImperativeHandle<T | null, T | null>(ref, () => innerRef.current);

  return innerRef;
}
