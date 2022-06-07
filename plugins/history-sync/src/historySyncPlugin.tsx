import { Activity } from "@stackflow/core";
import { StackflowPlugin } from "@stackflow/react";

const STATE_TAG = `${process.env.PACKAGE_NAME}@${process.env.PACKAGE_VERSION}`;

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

export function historySyncPlugin(): StackflowPlugin {
  return () => {
    let pushFlag = false;
    let onPopStateDisposer: (() => void) | null = null;

    return {
      key: "historySync",
      initialPushedEvent() {
        const initHistoryState = parseState(window.history.state);

        if (!initHistoryState) {
          return null;
        }

        return initHistoryState.activity.pushedEvent;
      },
      onInit({ getState, dispatchEvent }) {
        const initHistoryState = parseState(window.history.state);

        if (!initHistoryState) {
          const rootActivity = getState().activities[0];

          replaceState(
            {
              _TAG: STATE_TAG,
              activity: rootActivity,
            },
            rootActivity.id,
          );
        }

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
      onPushed(_, { activity }) {
        if (pushFlag) {
          pushFlag = false;
          return;
        }

        pushState(
          {
            _TAG: STATE_TAG,
            activity,
          },
          activity.id,
        );
      },
      onBeforePop({ preventDefault }) {
        preventDefault();

        do {
          window.history.back();
        } while (!parseState(window.history.state));
      },
    };
  };
}
