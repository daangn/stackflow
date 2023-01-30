import { isServer } from "./isServer";

export function isBrowser() {
  return !isServer();
}
