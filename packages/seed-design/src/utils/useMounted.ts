import { useEffect, useMemo, useReducer } from "react";

export function useMounted() {
  const [mounted, mount] = useReducer(() => true, false);

  useEffect(() => {
    setTimeout(() => {
      mount();
    }, 100);
  }, [mount]);

  return useMemo(() => ({ mounted }), [mounted]);
}
