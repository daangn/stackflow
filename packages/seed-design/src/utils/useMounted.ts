import { useEffect, useMemo, useReducer } from "react";

export function useMounted(options?: { afterRequestAnimationFrame?: boolean }) {
  const [mounted, mount] = useReducer(() => true, false);

  useEffect(() => {
    if (options?.afterRequestAnimationFrame) {
      const af = requestAnimationFrame(() => {
        mount();
      });

      return () => {
        cancelAnimationFrame(af);
      };
    }

    mount();

    return () => {};
  }, [mount]);

  return mounted;
}
