import { useEffect, useReducer, useState } from "react";

export function useMounted() {
  const [mounted, mount] = useReducer(() => true, false);

  useEffect(() => {
    mount();
  }, []);

  return mounted;
}
