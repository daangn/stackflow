import { Activity, id, makeEvent } from "@stackflow/core";
import { BaseActivities, StackflowPlugin } from "@stackflow/react";

import { makeTemplate } from "./makeTemplate";

const STATE_TAG = `${process.env.PACKAGE_NAME}@${process.env.PACKAGE_VERSION}`;

const SECOND = 1000;
const MINUTE = 60 * SECOND;

interface State {
  _TAG: string;
  activity: Activity;
}
function parseState(state: any): State | null {
  const _state: any = state;

  if (
    typeof _state === "object" &&
    _state !== null &&
    "_TAG" in _state &&
    typeof _state._TAG === "string" &&
    _state._TAG === STATE_TAG
  ) {
    return state;
  }

  return null;
}

function pushState(state: State, url: string) {
  window.history.pushState(state, "", url);
}

function replaceState(state: State, url: string) {
  window.history.replaceState(state, "", url);
}

type HistorySyncPluginOptions<T extends BaseActivities> = {
  routes: {
    [key in keyof T]: string;
  };
};
export function historySyncPlugin<T extends BaseActivities>(
  options: HistorySyncPluginOptions<T>,
): StackflowPlugin {
  return () => {
    let pushFlag = false;
    let onPopStateDisposer: (() => void) | null = null;

    return {
      key: "historySync",
      onInit({ actions: { getState, dispatchEvent } }) {
        const rootActivity = getState().activities[0];
        const template = makeTemplate(options.routes[rootActivity.name]);

        replaceState(
          {
            _TAG: STATE_TAG,
            activity: rootActivity,
          },
          template.fill(rootActivity.params),
        );

        const onPopState = (e: PopStateEvent) => {
          const historyState = parseState(e.state);

          if (!historyState) {
            return;
          }

          const { activities } = getState();

          const targetActivity = activities.find(
            (activity) =>
              activity.id === historyState.activity.pushedEvent.activityId,
          );

          const isBackward =
            (!targetActivity &&
              historyState.activity.pushedEvent.activityId <
                activities[0].id) ||
            targetActivity?.transitionState === "enter-active" ||
            targetActivity?.transitionState === "enter-done";
          const isForward =
            (!targetActivity &&
              historyState.activity.pushedEvent.activityId >
                activities[activities.length - 1].id) ||
            targetActivity?.transitionState === "exit-active" ||
            targetActivity?.transitionState === "exit-done";

          if (isBackward) {
            dispatchEvent("Popped", {});

            if (!targetActivity) {
              pushFlag = true;

              dispatchEvent("Pushed", {
                ...historyState.activity.pushedEvent,
              });
            }
          }
          if (isForward) {
            pushFlag = true;

            dispatchEvent("Pushed", {
              activityId: historyState.activity.pushedEvent.activityId,
              activityName: historyState.activity.pushedEvent.activityName,
              params: historyState.activity.pushedEvent.params,
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

        pushState(
          {
            _TAG: STATE_TAG,
            activity,
          },
          template.fill(activity.params),
        );
      },
      onBeforePop({ actions: { preventDefault } }) {
        preventDefault();

        do {
          window.history.back();
        } while (!parseState(window.history.state));
      },
      overrideInitialPushedEvent({ stackContext }) {
        const initHistoryState = parseState(window.history.state);

        if (initHistoryState) {
          return initHistoryState.activity.pushedEvent;
        }

        const { req } = stackContext;

        const path = stackContext?.req?.path
          ? stackContext.req.path
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
          const params = template.parse(req.path);

          if (params) {
            return makeEvent("Pushed", {
              activityId: id(),
              activityName,
              params,
              eventDate: new Date().getTime() - MINUTE,
            });
          }
        }

        return null;
      },
    };
  };
}
