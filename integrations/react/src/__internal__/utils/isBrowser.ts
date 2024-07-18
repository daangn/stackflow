import { isServer } from "./isServer";

/**
 * @description
 * 현재 JS 런타임이 브라우저 환경인지 확인해요.
 */
export function isBrowser() {
  return !isServer();
}
