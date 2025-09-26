import { useIsRenderInTransition } from "useIsRenderInTransition";
import { use } from "react18-use";

export function useDelayTransitionRender() {
  const isRenderInTransition = useIsRenderInTransition();

  if (isRenderInTransition) use(suspenseSentinel);
}

const suspenseSentinel = new Promise(() => {});
