import type { TypeLink } from "./Link.solid";
import { Link } from "./Link.solid";

export function createLinkComponent<
  T extends { [activityName: string]: unknown },
>(): {
  Link: TypeLink<T>;
} {
  return {
    Link,
  };
}
