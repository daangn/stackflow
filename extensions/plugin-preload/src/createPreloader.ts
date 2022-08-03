import type { ActivityComponentType } from "@stackflow/react";

import type { PreloadFunc } from "./usePreloader";
import { usePreloader } from "./usePreloader";

export function createPreloader<
  T extends { [activityName: string]: ActivityComponentType },
>(): {
  usePreloader: () => { preload: PreloadFunc<T> };
} {
  return {
    usePreloader,
  };
}
