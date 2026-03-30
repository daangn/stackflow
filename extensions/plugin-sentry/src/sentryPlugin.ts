import * as Sentry from "@sentry/browser";
import {
  SEMANTIC_ATTRIBUTE_SENTRY_OP,
  SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN,
  SEMANTIC_ATTRIBUTE_SENTRY_SOURCE,
} from "@sentry/core";
import type { StackflowPlugin } from "@stackflow/core";

type NavigationAction = "push" | "pop" | "replace";

function startNavigationSpan(
  action: NavigationAction,
  activityName: string,
): void {
  const client = Sentry.getClient();
  if (!client) return;

  Sentry.startBrowserTracingNavigationSpan(client, {
    name: `${action} ${activityName}`,
    attributes: {
      [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "navigation",
      [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.navigation.stackflow",
      [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "route",
    },
  });
}

function addNavigationBreadcrumb(
  action: NavigationAction,
  activityName: string,
): void {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `${action} ${activityName}`,
    level: "info",
  });
}

export function sentryPlugin(): StackflowPlugin {
  return () => ({
    key: "plugin-sentry",
    onPushed({ effect }) {
      startNavigationSpan("push", effect.activity.name);
      addNavigationBreadcrumb("push", effect.activity.name);
    },
    onPopped({ effect }) {
      startNavigationSpan("pop", effect.activity.name);
      addNavigationBreadcrumb("pop", effect.activity.name);
    },
    onReplaced({ effect }) {
      startNavigationSpan("replace", effect.activity.name);
      addNavigationBreadcrumb("replace", effect.activity.name);
    },
  });
}
