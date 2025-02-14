import * as Sentry from "@sentry/browser";
import type { BrowserOptions } from "@sentry/browser";
import {
  SEMANTIC_ATTRIBUTE_SENTRY_OP,
  SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN,
  SEMANTIC_ATTRIBUTE_SENTRY_SOURCE,
} from "@sentry/core";
import type { Integration } from "@sentry/types";
import type {
  DomainEvent,
  Effect,
  Stack,
  StackflowActions,
  StackflowPlugin,
} from "@stackflow/core";

import { stackflowBrowserTracingIntegration } from "./integration";

export function sentryPlugin(options: BrowserOptions): StackflowPlugin {
  return () => ({
    key: "plugin-sentry",
    onInit() {
      Sentry.init({
        ...options,
        integrations: [
          stackflowBrowserTracingIntegration(),
          ...(options.integrations as Integration[]),
        ],
      });
    },
    onPushed({ effect }) {
      const client = Sentry.getClient();
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
      const client = Sentry.getClient();
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
      const client = Sentry.getClient();
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
