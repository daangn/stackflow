import { useEffect, useRef } from "react";
import compare from "react-fast-compare";

export function useMemoDeep<T>(next: T) {
  const previousRef = useRef(next);
  const previous = previousRef.current;
  const isEqual = compare(previous, next);

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next;
    }
  });

  return isEqual ? previous : next;
}
