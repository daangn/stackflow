import { useEffect, useState } from "react";

// https://github.com/MingruiZhang/react-animate-mount/blob/32300c04a4fdfa97724b70aaaf0c0f403d6da247/src/Animate.js#L171-L179
function requestNextFrame(cb: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cb();
    });
  });
}

export function useLazy<T>(value: T) {
  const [state, setState] = useState<T | null>(null);

  useEffect(() => {
    requestNextFrame(() => {
      setState(value);
    });
  }, [value]);

  return state;
}
