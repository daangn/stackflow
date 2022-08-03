import type React from "react";

/**
 * Referenced from
 * https://github.com/vercel/next.js/blob/135a4cfc6632887aaccd2452d5c413419163680c/packages/next/client/link.tsx#L97-L107
 */
export function isModifiedEvent(
  event: React.MouseEvent<HTMLAnchorElement>,
): boolean {
  const { target } = event.currentTarget;

  return (
    (target && target !== "_self") ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey || // triggers resource download
    (event.nativeEvent && event.nativeEvent.which === 2)
  );
}
