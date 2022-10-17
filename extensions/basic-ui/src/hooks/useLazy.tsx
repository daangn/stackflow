import { useEffect, useState } from "react";

import { requestNextFrame } from "../utils";

export function useLazy<T>(value: T) {
  const [state, setState] = useState<T | undefined>(undefined);

  useEffect(() => {
    requestNextFrame(() => {
      setState(value);
    });
  }, [value]);

  return state;
}
