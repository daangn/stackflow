const { TextDecoder, TextEncoder } = require("node:util");

// `jest-environment-jsdom` does not expose `TextEncoder`/`TextDecoder`, which
// `react-dom/server` requires. Polyfill them for the SSR/hydration tests.
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder;
}
