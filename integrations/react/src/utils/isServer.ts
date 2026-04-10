/**
 * @description
 * 현재 JS 런타임이 서버 환경인지 확인해요.
 */
export function isServer() {
  return typeof window === "undefined";
}
