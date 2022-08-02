import type { Activity } from "@stackflow/core";
import { id, makeEvent } from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";
import React from "react";

import { makeTemplate } from "./makeTemplate";

const STATE_TAG = `${process.env.PACKAGE_NAME}@${process.env.PACKAGE_VERSION}`;

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const isServer = typeof window === "undefined";

function getCurrentState() {
  if (isServer) {
    return null;
  }

  return window.history.state;
}

function normalizeRoute(route: string | string[]) {
  return typeof route === "string" ? [route] : route;
}

interface State {
  _TAG: string;
  activity: Activity;
}
function parseState(state: unknown): State | null {
  const _state: any = state;

  if (
    typeof _state === "object" &&
    _state !== null &&
    "_TAG" in _state &&
    typeof _state._TAG === "string" &&
    _state._TAG === STATE_TAG
  ) {
    return state as State;
  }

  return null;
}

function pushState({
  state,
  url,
  useHash,
}: {
  state: State;
  url: string;
  useHash?: boolean;
}) {
  if (isServer) {
    return;
  }
  const nextUrl = useHash ? `${window.location.pathname}#${url}` : url;
  window.history.pushState(state, "", nextUrl);
}

function replaceState({
  state,
  url,
  useHash,
}: {
  state: State;
  url: string;
  useHash?: boolean;
}) {
  if (isServer) {
    return;
  }
  const nextUrl = useHash ? `${window.location.pathname}#${url}` : url;
  window.history.replaceState(state, "", nextUrl);
}

const startTransition: React.TransitionStartFunction =
  React.startTransition ?? ((cb: () => void) => cb());

type HistorySyncPluginOptions<K extends string> = {
  routes: {
    [key in K]: string | string[];
  };
  fallbackActivity: (args: { initContext: any }) => K;
  useHash?: boolean;
};
export function historySyncPlugin<T extends { [activityName: string]: any }>(
  options: HistorySyncPluginOptions<Extract<keyof T, string>>,
): StackflowReactPlugin<T> {
  type K = Extract<keyof T, string>;

  return ({ initContext }) => {
    let pushFlag = false;
    let onPopStateDisposer: (() => void) | null = null;

    return {
      key: "historySync",
      overrideInitialPushedEvent() {
        const initHistoryState = parseState(getCurrentState());

        if (initHistoryState) {
          return {
            ...initHistoryState.activity.pushedBy,
            name: "Pushed",
          };
        }

        function resolvePath() {
          if (
            initContext?.req?.path &&
            typeof initContext.req.path === "string"
          ) {
            return initContext.req.path as string;
          }
          if (isServer) {
            return null;
          }

          if (options.useHash) {
            return window.location.hash.split("#")[1] ?? "/";
          }

          return window.location.pathname + window.location.search;
        }

        const path = resolvePath();
        const activityNames = Object.keys(options.routes);

        if (path) {
          for (let i = 0; i < activityNames.length; i += 1) {
            const activityName = activityNames[i] as K;
            const routes = normalizeRoute(options.routes[activityName]);

            for (let j = 0; j < routes.length; j += 1) {
              const route = routes[j];

              const template = makeTemplate(route);
              const activityParams = template.parse(path);
              const matched = !!activityParams;

              if (matched) {
                const activityId = id();

                return makeEvent("Pushed", {
                  activityId,
                  activityName,
                  params: {
                    ...activityParams,
                  },
                  eventDate: new Date().getTime() - MINUTE,
                  eventContext: {
                    "plugin-history-sync": {
                      path,
                    },
                  },
                });
              }
            }
          }
        }

        const fallbackActivityId = id();
        const fallbackActivityName = options.fallbackActivity({ initContext });
        const fallbackActivityRoutes = normalizeRoute(
          options.routes[fallbackActivityName],
        );
        const fallbackActivityPath = fallbackActivityRoutes[0];

        return makeEvent("Pushed", {
          activityId: fallbackActivityId,
          activityName: fallbackActivityName,
          params: {},
          eventDate: new Date().getTime() - MINUTE,
          eventContext: {
            "plugin-history-sync": {
              path: fallbackActivityPath,
            },
          },
        });
      },
      onInit({ actions: { getStack, dispatchEvent, push } }) {
        const rootActivity = getStack().activities[0];
        const template = makeTemplate(
          normalizeRoute(options.routes[rootActivity.name])[0],
        );

        replaceState({
          url: template.fill(rootActivity.params),
          state: {
            _TAG: STATE_TAG,
            activity: rootActivity,
          },
          useHash: options.useHash,
        });

        const onPopState = (e: PopStateEvent) => {
          const historyState = parseState(e.state);

          if (!historyState) {
            return;
          }

          const { activities } = getStack();

          const targetActivity = activities.find(
            (activity) =>
              activity.id === historyState.activity.pushedBy.activityId,
          );

          const isBackward =
            (!targetActivity &&
              historyState.activity.pushedBy.activityId < activities[0].id) ||
            targetActivity?.transitionState === "enter-active" ||
            targetActivity?.transitionState === "enter-done";
          const isForward =
            (!targetActivity &&
              historyState.activity.pushedBy.activityId >
                activities[activities.length - 1].id) ||
            targetActivity?.transitionState === "exit-active" ||
            targetActivity?.transitionState === "exit-done";

          if (isBackward) {
            dispatchEvent("Popped", {});

            if (!targetActivity) {
              pushFlag = true;

              startTransition(() => {
                push({
                  ...historyState.activity.pushedBy,
                });
              });
            }
          }
          if (isForward) {
            pushFlag = true;

            startTransition(() => {
              push({
                activityId: historyState.activity.pushedBy.activityId,
                activityName: historyState.activity.pushedBy.activityName,
                params: historyState.activity.pushedBy.params,
              });
            });
          }
        };

        onPopStateDisposer?.();

        if (!isServer) {
          window.addEventListener("popstate", onPopState);
        }

        onPopStateDisposer = () => {
          if (!isServer) {
            window.removeEventListener("popstate", onPopState);
          }
        };
      },
      onPushed({ effect: { activity } }) {
        if (pushFlag) {
          pushFlag = false;
          return;
        }

        const template = makeTemplate(
          normalizeRoute(options.routes[activity.name])[0],
        );

        pushState({
          url: template.fill(activity.params),
          state: {
            _TAG: STATE_TAG,
            activity,
          },
          useHash: options.useHash,
        });
      },
      onReplaced({ effect: { activity } }) {
        const template = makeTemplate(
          normalizeRoute(options.routes[activity.name])[0],
        );

        replaceState({
          url: template.fill(activity.params),
          state: {
            _TAG: STATE_TAG,
            activity,
          },
          useHash: options.useHash,
        });
      },
      onBeforePush({ actionParams, actions: { overrideActionParams } }) {
        const template = makeTemplate(
          normalizeRoute(options.routes[actionParams.activityName])[0],
        );
        const path = template.fill(actionParams.params);

        overrideActionParams({
          ...actionParams,
          eventContext: {
            ...actionParams.eventContext,
            "plugin-history-sync": {
              path,
            },
          },
        });
      },
      onBeforeReplace({ actionParams, actions: { overrideActionParams } }) {
        const template = makeTemplate(
          normalizeRoute(options.routes[actionParams.activityName])[0],
        );
        const path = template.fill(actionParams.params);

        overrideActionParams({
          ...actionParams,
          eventContext: {
            ...actionParams.eventContext,
            "plugin-history-sync": {
              path,
            },
          },
        });
      },
      onBeforePop({ actions: { preventDefault } }) {
        preventDefault();

        do {
          if (typeof window !== "undefined") {
            window.history.back();
          }
        } while (!parseState(getCurrentState()));
      },
    };
  };
}
