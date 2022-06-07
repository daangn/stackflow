import { PushedEvent } from "@stackflow/core/dist/event-types";
import { StackflowPlugin } from "@stackflow/react";

interface State {
  _TAG: "@stackflow/plugin-history-sync";
  pushedEvent: PushedEvent;
}

interface HistorySyncPluginOptions {}
export function historySyncPlugin(
  options: HistorySyncPluginOptions,
): StackflowPlugin {
  return () => {
    let onPopStateCalled = false;
    let onPopStateDisposer: (() => void) | null = null;

    const initHistoryState = window.history.state as State;

    return {
      id: "historySync",
      initialPushedEvent() {
        if (initHistoryState?._TAG !== "@stackflow/plugin-history-sync") {
          return null;
        }

        return initHistoryState.pushedEvent;
      },
      onInit({ getState, dispatchEvent }) {
        if (initHistoryState?._TAG !== "@stackflow/plugin-history-sync") {
          const rootActivity = getState().activities[0];

          const newState: State = {
            _TAG: "@stackflow/plugin-history-sync",
            pushedEvent: rootActivity.pushedEvent,
          };

          window.history.replaceState(newState, "", rootActivity.id);
        }

        const onPopState = (e: PopStateEvent) => {
          const { state: historyState } = e as { state: State };

          if (historyState?._TAG !== "@stackflow/plugin-history-sync") {
            return;
          }

          if (onPopStateCalled) {
            onPopStateCalled = false;
            return;
          }

          onPopStateCalled = true;

          const { activities } = getState();

          const targetActivity = activities.find(
            (activity) => activity.id === historyState.pushedEvent.activityId,
          );

          const isBackward =
            (!targetActivity &&
              historyState.pushedEvent.activityId < activities[0].id) ||
            targetActivity?.transitionState === "enter-active" ||
            targetActivity?.transitionState === "enter-done";
          const isForward =
            (!targetActivity &&
              historyState.pushedEvent.activityId >
                activities[activities.length - 1].id) ||
            targetActivity?.transitionState === "exit-active" ||
            targetActivity?.transitionState === "exit-done";

          if (isBackward) {
            dispatchEvent("Popped", {});

            if (!targetActivity) {
              dispatchEvent("Pushed", {
                ...historyState.pushedEvent,
              });
            }
          }
          if (isForward) {
            dispatchEvent("Pushed", {
              activityId: historyState.pushedEvent.activityId,
              activityName: historyState.pushedEvent.activityName,
            });
          }
        };

        onPopStateDisposer?.();
        window.addEventListener("popstate", onPopState);

        onPopStateDisposer = () => {
          window.removeEventListener("popstate", onPopState);
        };
      },
      onPushed(_, { activity: { id, pushedEvent } }) {
        if (onPopStateCalled) {
          onPopStateCalled = false;
          return;
        }

        const state: State = {
          _TAG: "@stackflow/plugin-history-sync",
          pushedEvent,
        };

        window.history.pushState(state, "", id);
      },
      onPopped(_) {
        if (onPopStateCalled) {
          onPopStateCalled = false;
          return;
        }
        onPopStateCalled = true;

        window.history.back();
      },
    };
  };
}
