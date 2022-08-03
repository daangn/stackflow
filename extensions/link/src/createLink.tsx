import type { ActivityComponentType } from "@stackflow/react";
import type React from "react";

import type { LinkProps } from "./Link";
import { Link } from "./Link";
import type { PreloadFunc } from "./usePreloader";
import { usePreloader } from "./usePreloader";

export function createLink<
  T extends { [activityName: string]: ActivityComponentType },
>(): {
  Link: React.FC<LinkProps<T, Extract<keyof T, string>>>;
  usePreloader: () => { preload: PreloadFunc<T> };
} {
  return {
    Link,
    usePreloader,
  };
}
