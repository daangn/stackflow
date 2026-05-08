/**
 * FEP-1061 runtime enforcement at the `@stackflow/plugin-history-sync` boundary.
 *
 * `ActivityBaseParams` declares `{ [key: string]: string | undefined }`, but the
 * navigation paths feeding into the core store historically violated that
 * contract at runtime:
 *
 * - `push({ visible: true })` placed the boolean `true` in the store.
 * - URL-arrival parsed the same URL as `{ visible: "true" }` (a string).
 * - A `decode` hook on a route could inject typed values (e.g. `Number(...)`)
 *   back into the store via `overrideInitialEvents`.
 *
 * This utility coerces every non-string/non-undefined value to a string so
 * that, regardless of navigation path (push / replace / stepPush / stepReplace
 * / URL arrival with or without `decode`), the values entering the core store
 * are always `string | undefined`. It is invoked in the plugin's
 * `onBeforePush` / `onBeforeReplace` / `onBeforeStepPush` / `onBeforeStepReplace`
 * pre-effect hooks (after `encode` has consumed the typed params to build the
 * URL) and on the decode-arrival path before the initial events reach the
 * store.
 */
export function coerceParamsToString(
  params: Record<string, unknown> | undefined | null,
): Record<string, string | undefined> {
  if (params == null) return {};
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      result[key] = undefined;
      continue;
    }
    if (typeof value === "string") {
      result[key] = value;
      continue;
    }
    if (typeof value === "object" || typeof value === "function") {
      try {
        const stringified = JSON.stringify(value);
        result[key] =
          typeof stringified === "string" ? stringified : String(value);
      } catch {
        result[key] = String(value);
      }
      continue;
    }
    result[key] = String(value);
  }
  return result;
}
