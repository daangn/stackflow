import type { TypeLink } from "./Link";
import { Link } from "./Link";

export function createLinkComponent<
  T extends { [activityName: string]: unknown },
>(): {
  Link: TypeLink<T>;
} {
  return {
    Link,
  };
}
