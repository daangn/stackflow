import type React from "react";
import { useEffect, useRef } from "react";

import { useMounted } from "./useMounted";

export function useVariant<V extends string>({
  base,
  variants,
  variant,
  lazy = {},
}: {
  base: string;
  variants: {
    [key in V]: string;
  };
  variant: V;
  lazy?: {
    [key in V]?: true;
  };
}): {
  ref: React.RefObject<any>;
  className: string;
} {
  const ref = useRef<any>(null);

  const mounted = useMounted({
    afterAnimationFrame: true,
  });

  useEffect(() => {
    const $el = ref.current;

    if (!$el) {
      return;
    }

    Object.keys(variants)
      .filter((v): v is V => true)
      .forEach((v) => {
        $el.classList.remove(variants[v]);
      });

    if (lazy[variant] && !mounted) {
      return;
    }

    $el.classList.add(variants[variant]);
  }, [ref, variant, mounted]);

  const className = [base, ...(lazy[variant] ? [] : [variants[variant]])].join(
    " ",
  );

  return {
    ref,
    className,
  };
}
