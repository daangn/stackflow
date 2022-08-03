import type { PreloadFunc } from "./usePreloader";
import { usePreloader } from "./usePreloader";

export function createPreloader<
  T extends { [activityName: string]: unknown },
>(): {
  usePreloader: () => { preload: PreloadFunc<T> };
} {
  return {
    usePreloader,
  };
}
