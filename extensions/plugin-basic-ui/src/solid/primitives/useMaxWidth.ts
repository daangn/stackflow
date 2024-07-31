import { createEffect, createSignal, onCleanup } from "solid-js";

import { listenResize } from "../../common/utils";

export function useMaxWidth(props: {
  outerRef: HTMLElement | undefined;
  innerRef: HTMLElement | undefined;
  enable: boolean;
}) {
  const [maxWidth, setMaxWidth] = createSignal<number | undefined>(undefined);

  createEffect(() => {
    const $outer = props.outerRef;
    const $inner = props.innerRef;

    if (!props.enable || !$outer || !$inner) return;

    const dispose = listenResize(() => {
      const screenWidth = $outer.clientWidth;

      const leftWidth = $inner.offsetLeft;
      const centerWidth = $inner.clientWidth;
      const rightWidth = screenWidth - leftWidth - centerWidth;

      const sideMargin = Math.max(leftWidth, rightWidth);

      setMaxWidth(screenWidth - 2 * sideMargin);
    });

    onCleanup(dispose);
  });

  return {
    maxWidth,
  };
}
