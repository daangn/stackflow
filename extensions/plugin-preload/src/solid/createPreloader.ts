import type { Preloader } from "../common/makePreloader";
import { usePreloader } from "./usePreloader";

export function createPreloader<
  T extends { [activityName: string]: unknown },
>(): {
  usePreloader: () => () => Preloader<T>;
} {
  return {
    usePreloader,
  };
}
