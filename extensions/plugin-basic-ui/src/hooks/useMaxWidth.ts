import { useEffect, useState } from "react";

import { listenResize, noop } from "../utils";

export function useMaxWidth({
  outerRef,
  innerRef,
  enable,
}: {
  outerRef: React.ForwardedRef<any>;
  innerRef: React.MutableRefObject<any>;
  enable: boolean;
}) {
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const $outer = outerRef && "current" in outerRef && outerRef.current;
    const $inner = innerRef.current;

    if (!enable || !$outer || !$inner) {
      return noop;
    }

    const dispose = listenResize(() => {
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
    maxWidth,
  };
}
