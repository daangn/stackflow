import { Activity, id, makeEvent, StackflowPlugin } from "@stackflow/core";

import { makeTemplate } from "./makeTemplate";

const STATE_TAG = `${process.env.PACKAGE_NAME}@${process.env.PACKAGE_VERSION}`;

const SECOND = 1000;
const MINUTE = 60 * SECOND;

function getCurrentState() {
  return window.history.state ?? {};
}

interface State {
  _TAG: string;
  activity: Activity;
}
function parseState({ state }: { state: unknown }): State | null {
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
  const nextUrl = useHash ? `${window.location.pathname}#${url}` : url;
  window.history.replaceState(state, "", nextUrl);
}

type HistorySyncPluginOptions<T extends { [activityName: string]: any }> = {
  routes: {
    [key in keyof T]: string;
  };
  fallbackActivity: (args: { context: any }) => Extract<keyof T, string>;
  useHash?: boolean;
};
export function historySyncPlugin<T extends { [activityName: string]: any }>(
  options: HistorySyncPluginOptions<T>,
): StackflowPlugin {
  return ({ context }) => {
    let pushFlag = false;
    let onPopStateDisposer: (() => void) | null = null;

    return {
      key: "historySync",
      initialPushedEvent() {
        const initHistoryState = parseState(getCurrentState());

        if (initHistoryState) {
          return {
            ...initHistoryState.activity.pushedBy,
            name: "Pushed",
          };
        }

        const path = context?.req?.path
          ? context.req.path
          : typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : null;

        if (!path) {
          return null;
        }

        const activityNames = Object.keys(options.routes);

        for (let i = 0; i < activityNames.length; i += 1) {
          const activityName = activityNames[i];
          const template = makeTemplate(options.routes[activityName]);
          const params = template.parse(path);

          if (params) {
            return makeEvent("Pushed", {
              activityId: id(),
              activityName,
              params,
              eventDate: new Date().getTime() - MINUTE,
            });
          }
        }

        return makeEvent("Pushed", {
          activityId: id(),
          activityName: options.fallbackActivity({ context }),
          params: {},
          eventDate: new Date().getTime() - MINUTE,
        });
      },
      onInit({ actions: { getStack, dispatchEvent } }) {
        const rootActivity = getStack().activities[0];
        const template = makeTemplate(options.routes[rootActivity.name]);

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

              dispatchEvent("Pushed", {
                ...historyState.activity.pushedBy,
              });
            }
          }
          if (isForward) {
            pushFlag = true;

            dispatchEvent("Pushed", {
              activityId: historyState.activity.pushedBy.activityId,
              activityName: historyState.activity.pushedBy.activityName,
              params: historyState.activity.pushedBy.params,
            });
          }
        };

        onPopStateDisposer?.();
        window.addEventListener("popstate", onPopState);

        onPopStateDisposer = () => {
          window.removeEventListener("popstate", onPopState);
        };
      },
      onPushed({ effect: { activity } }) {
        if (pushFlag) {
          pushFlag = false;
          return;
        }

        const template = makeTemplate(options.routes[activity.name]);

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
        const template = makeTemplate(options.routes[activity.name]);

        replaceState({
          url: template.fill(activity.params),
          state: {
            _TAG: STATE_TAG,
            activity,
          },
          useHash: options.useHash,
        });
      },
      onBeforePop({ actions: { preventDefault } }) {
        preventDefault();

        do {
          window.history.back();
        } while (!parseState(getCurrentState()));
      },
    };
  };
}
