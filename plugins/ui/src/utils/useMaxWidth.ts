import { useEffect, useRef, useState } from "react";

import { noop } from "./noop";
import { onResize } from "./onResize";

export function useMaxWidth({ disable }: { disable: boolean }) {
  const outerRef = useRef<any>(null);
  const innerRef = useRef<any>(null);

  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const $outer = outerRef.current;
    const $inner = innerRef.current;

    if (disable || !$outer || !$inner) {
      return noop;
    }

    const dispose = onResize(() => {
      const screenWidth = $outer.clientWidth;

      const leftWidth = $inner.offsetLeft;
      const centerWidth = $inner.clientWidth;
      const rightWidth = screenWidth - leftWidth - centerWidth;

      const sideMargin = Math.max(leftWidth, rightWidth);

      setMaxWidth(screenWidth - 2 * sideMargin);
    });

    return dispose;
  }, []);

  return {
    outerRef,
    innerRef,
    maxWidth,
  };
}
