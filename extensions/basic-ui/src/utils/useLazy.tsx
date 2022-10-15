import { useEffect, useState } from "react";

import { requestNextFrame } from "./requestNextFrame";

export function useLazy<T>(value: T) {
  const [state, setState] = useState<T | null>(null);

  useEffect(() => {
    requestNextFrame(() => {
      setState(value);
    });
  }, [value]);

  return state;
}
