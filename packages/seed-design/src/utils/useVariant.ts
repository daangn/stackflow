import React, { useEffect, useRef } from "react";

import { useMounted } from "./useMounted";

export function useVariant<V extends string>({
  variant,
  classNames,
  lazy,
}: {
  variant: V;
  classNames: {
    [key in V]: string;
  };
  lazy: {
    [key in V]?: true;
  };
}): {
  ref: React.RefObject<any>;
} {
  const ref = useRef<any>(null);

  const mounted = useMounted({
    afterRequestAnimationFrame: true,
  });

  useEffect(() => {
    const $el = ref.current;

    if (!$el) {
      return;
    }

    Object.keys(classNames)
      .filter((v): v is V => true)
      .forEach((v) => {
        $el.classList.remove(classNames[v]);
      });

    if (lazy[variant] && !mounted) {
      return;
    }

    $el.classList.add(classNames[variant]);
  }, [ref, variant, mounted]);

  return { ref };
}
