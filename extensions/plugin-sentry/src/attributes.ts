import { SDK_VERSION } from "@sentry/browser";

/**
 * Span attribute holding the transaction (segment) name source.
 * Sentry 8-10 read `sentry.source`. Sentry 11 reads `sentry.segment.name.source`
 * and no longer exports `SEMANTIC_ATTRIBUTE_SENTRY_SOURCE`, so the key is chosen
 * from the `@sentry/browser` version instead of importing the constant. The spans
 * are started through `@sentry/browser`, so its version decides which key is read.
 */
export const SEMANTIC_ATTRIBUTE_SENTRY_SOURCE =
  Number.parseInt(SDK_VERSION, 10) >= 11
    ? "sentry.segment.name.source"
    : "sentry.source";
