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
  params: Record<string, string | undefined>,
): void {
  const client = Sentry.getClient();
  if (!client) return;

  Sentry.startBrowserTracingNavigationSpan(client, {
    name: `${action} ${activityName}`,
    attributes: {
      [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "navigation",
      [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.navigation.stackflow",
      [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "route",
      "stackflow.action": action,
      "stackflow.activity": activityName,
      ...prefixKeys("stackflow.params", params),
    },
  });
}

function addNavigationBreadcrumb(
  action: NavigationAction,
  activityName: string,
  params: Record<string, string | undefined>,
): void {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `${action} ${activityName}`,
    level: "info",
    data: params,
  });
}

function prefixKeys(
  prefix: string,
  params: Record<string, string | undefined>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      result[`${prefix}.${key}`] = value;
    }
  }
  return result;
}

export function sentryPlugin(): StackflowPlugin {
  return () => ({
    key: "plugin-sentry",
    onPushed({ effect }) {
      const { name, params } = effect.activity;
      startNavigationSpan("push", name, params);
      addNavigationBreadcrumb("push", name, params);
    },
    onPopped({ effect }) {
      const { name, params } = effect.activity;
      startNavigationSpan("pop", name, params);
      addNavigationBreadcrumb("pop", name, params);
    },
    onReplaced({ effect }) {
      const { name, params } = effect.activity;
      startNavigationSpan("replace", name, params);
      addNavigationBreadcrumb("replace", name, params);
    },
  });
}
