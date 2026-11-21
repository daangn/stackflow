import {
  browserTracingIntegration as originalBrowserTracingIntegration,
  startBrowserTracingPageLoadSpan,
} from "@sentry/browser";
import {
  SEMANTIC_ATTRIBUTE_SENTRY_OP,
  SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN,
} from "@sentry/core";
import { SEMANTIC_ATTRIBUTE_SENTRY_SOURCE } from "./attributes";

export function stackflowBrowserTracingIntegration(
  options: Parameters<typeof originalBrowserTracingIntegration>[0] = {},
) {
  const browserTracingIntegrationInstance = originalBrowserTracingIntegration({
    ...options,
    instrumentNavigation: false,
    instrumentPageLoad: false,
  });
  const { instrumentPageLoad = true } = options;

  return {
    ...browserTracingIntegrationInstance,
    afterAllSetup(
      client: Parameters<typeof browserTracingIntegrationInstance.afterAllSetup>[0],
    ) {
      browserTracingIntegrationInstance.afterAllSetup(client);

      const initialWindowLocation =
        typeof window !== "undefined" ? window.location : undefined;

      if (instrumentPageLoad && initialWindowLocation) {
        startBrowserTracingPageLoadSpan(client, {
          name: initialWindowLocation.pathname,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "pageload",
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.pageload.stackflow",
            [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",
          },
        });
      }
    },
  };
}
