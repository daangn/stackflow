import type { TypeLink } from "./Link";
import { Link } from "./Link";

export function createLinkComponent<T extends Record<string, unknown>>(): {
  Link: TypeLink<T>;
} {
  return {
    Link,
  };
}
