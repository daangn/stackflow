import { useEffect, useMemo, useReducer } from "react";

export function useMounted(options?: { afterAnimationFrame?: boolean }) {
  const [mounted, mount] = useReducer(() => true, false);

  useEffect(() => {
    if (options?.afterAnimationFrame) {
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
