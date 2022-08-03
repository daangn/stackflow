import type { TypeLink } from "./Link";
import { Link } from "./Link";

export function createLink<T extends { [activityName: string]: unknown }>(): {
  Link: TypeLink<T>;
} {
  return {
    Link,
  };
}
