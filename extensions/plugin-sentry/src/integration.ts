import {
  WINDOW,
  browserTracingIntegration as originalBrowserTracingIntegration,
  startBrowserTracingPageLoadSpan,
} from "@sentry/browser";
import {
  SEMANTIC_ATTRIBUTE_SENTRY_OP,
  SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN,
  SEMANTIC_ATTRIBUTE_SENTRY_SOURCE,
} from "@sentry/core";

import type { Integration } from "@sentry/types";

export function stackflowBrowserTracingIntegration(
  options: Parameters<typeof originalBrowserTracingIntegration>[0] = {},
): Integration {
  const browserTracingIntegrationInstance = originalBrowserTracingIntegration({
    ...options,
    instrumentNavigation: false,
    instrumentPageLoad: false,
  });
  const { instrumentPageLoad = true } = options;

  return {
    ...browserTracingIntegrationInstance,
    afterAllSetup(client) {
      browserTracingIntegrationInstance.afterAllSetup(client);

      const initialWindowLocation = WINDOW.location;

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
