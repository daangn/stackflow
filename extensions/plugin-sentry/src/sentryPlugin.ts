import * as Sentry from "@sentry/browser";
import {
  SEMANTIC_ATTRIBUTE_SENTRY_OP,
  SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN,
  SEMANTIC_ATTRIBUTE_SENTRY_SOURCE,
  getClient,
} from "@sentry/core";
import type {
  DomainEvent,
  Effect,
  Stack,
  StackflowActions,
  StackflowPlugin,
} from "@stackflow/core";

import type { Integration } from "@sentry/types";
import { stackflowBrowserTracingIntegration } from "./integration";

export function sentryPlugin(): StackflowPlugin {
  return () => ({
    key: "plugin-sentry",
    onInit() {
      Sentry.init({
        dsn: "https://de8235db42e3f12757ff2ab2e5f5b75f@o4508278402187264.ingest.us.sentry.io/4508279653728256",
        integrations: [
          /**
           * make integration
           */
          stackflowBrowserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        // Tracing
        tracesSampleRate: 1.0, //  Capture 100% of the transactions
        // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/yourserver\.io\/api/,
        ],
        // Session Replay
        replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
        replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
      });
    },
    onPushed({ effect }) {
      const client = getClient();
      if (!client) return;
      Sentry.startBrowserTracingNavigationSpan(client, {
        name: `push ${effect.activity.name}`,
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "navigation",
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.navigation.stackflow",
          [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "route",
        },
      });
    },
    onPopped({ effect }) {
      const client = getClient();
      if (!client) return;
      Sentry.startBrowserTracingNavigationSpan(client, {
        name: `pop ${effect.activity.name}`,
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "navigation",
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.navigation.stackflow",
          [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "route",
        },
      });
    },
    onReplaced({ effect }) {
      const client = getClient();
      if (!client) return;
      Sentry.startBrowserTracingNavigationSpan(client, {
        name: `replace ${effect.activity.name}`,
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "navigation",
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.navigation.stackflow",
          [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "route",
        },
      });
    },
  });
}
