import type { Activity } from "@stackflow/core";
import { id, makeEvent } from "@stackflow/core";
import type { ActivityStep } from "@stackflow/core/dist/AggregateOutput";
import type { StackflowReactPlugin } from "@stackflow/react";
import React from "react";

import { last } from "./last";
import { makeTemplate } from "./makeTemplate";
import { normalizeRoute } from "./normalizeRoute";
import { RoutesProvider } from "./RoutesContext";

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

interface State {
  _TAG: string;
  activity: Activity;
  step?: ActivityStep;
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
  url,
  state,
  useHash,
}: {
  url: string;
  state: State;
  useHash?: boolean;
}) {
  if (isServer) {
    return;
  }
  const nextUrl = useHash ? `${window.location.pathname}#${url}` : url;
  window.history.replaceState(state, "", nextUrl);
}

/**
 * Removes activity context before serialization
 */
function removeActivityContext(activity: Activity): Activity {
  return {
    ...activity,
    context: undefined,
    pushedBy: {
      ...activity.pushedBy,
      activityContext: undefined,
    },
  };
}

const startTransition: React.TransitionStartFunction =
  React.startTransition ?? ((cb: () => void) => cb());

type HistorySyncPluginOptions<K extends string> = {
  routes: {
    [key in K]: string | string[];
  };
  fallbackActivity: (args: { initialContext: any }) => K;
  useHash?: boolean;
};
export function historySyncPlugin<
  T extends { [activityName: string]: unknown },
>(
  options: HistorySyncPluginOptions<Extract<keyof T, string>>,
): StackflowReactPlugin<T> {
  type K = Extract<keyof T, string>;

  return () => {
    let pushFlag = 0;
    let popFlag = 0;

    return {
      key: "plugin-history-sync",
      wrapStack({ stack }) {
        return (
          <RoutesProvider routes={options.routes}>
            {stack.render()}
          </RoutesProvider>
        );
      },
      overrideInitialEvents({ initialContext }) {
        const initialHistoryState = parseState(getCurrentState());

        if (initialHistoryState) {
          return [
            {
              ...initialHistoryState.activity.pushedBy,
              name: "Pushed",
            },
            ...(initialHistoryState.step?.pushedBy.name === "StepPushed" ||
            initialHistoryState.step?.pushedBy.name === "StepReplaced"
              ? [
                  {
                    ...initialHistoryState.step.pushedBy,
                    name: "StepPushed" as const,
                  },
                ]
              : []),
          ];
        }

        function resolvePath() {
          if (
            initialContext?.req?.path &&
            typeof initialContext.req.path === "string"
          ) {
            return initialContext.req.path as string;
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

                return [
                  makeEvent("Pushed", {
                    activityId,
                    activityName,
                    activityParams: {
                      ...activityParams,
                    },
                    eventDate: new Date().getTime() - MINUTE,
                    activityContext: {
                      path,
                    },
                  }),
                ];
              }
            }
          }
        }

        const fallbackActivityId = id();
        const fallbackActivityName = options.fallbackActivity({
          initialContext,
        });
        const fallbackActivityRoutes = normalizeRoute(
          options.routes[fallbackActivityName],
        );
        const fallbackActivityPath = fallbackActivityRoutes[0];

        return [
          makeEvent("Pushed", {
            activityId: fallbackActivityId,
            activityName: fallbackActivityName,
            activityParams: {},
            eventDate: new Date().getTime() - MINUTE,
            activityContext: {
              path: fallbackActivityPath,
            },
          }),
        ];
      },
      onInit({ actions: { getStack, dispatchEvent, push, stepPush } }) {
        const rootActivity = getStack().activities[0];
        const template = makeTemplate(
          normalizeRoute(options.routes[rootActivity.name])[0],
        );

        (window as any).getStack = getStack;

        replaceState({
          url: template.fill(rootActivity.params),
          state: {
            _TAG: STATE_TAG,
            activity: removeActivityContext(rootActivity),
            step: last(rootActivity.steps),
          },
          useHash: options.useHash,
        });

        const onPopState = (e: PopStateEvent) => {
          if (popFlag) {
            popFlag -= 1;
            return;
          }

          const historyState = parseState(e.state);

          if (!historyState) {
            return;
          }

          const targetActivity = historyState.activity;
          const targetActivityId = historyState.activity.id;
          const targetStep = historyState.step;

          const { activities } = getStack();
          const currentActivity = activities.find(
            (activity) => activity.isActive,
          );

          if (!currentActivity) {
            return;
          }

          const currentStep = last(currentActivity.steps);

          const nextActivity = activities.find(
            (activity) => activity.id === targetActivityId,
          );
          const nextStep = currentActivity.steps.find(
            (step) => step.id === targetStep?.id,
          );

          const isBackward = () => currentActivity.id > targetActivityId;
          const isForward = () => currentActivity.id < targetActivityId;
          const isStep = () => currentActivity.id === targetActivityId;

          const isStepBackward = () => {
            if (!isStep()) {
              return false;
            }

            if (!targetStep) {
              return true;
            }
            if (currentStep && currentStep.id > targetStep.id) {
              return true;
            }

            return false;
          };
          const isStepForward = () => {
            if (!isStep()) {
              return false;
            }

            if (!currentStep) {
              return true;
            }
            if (targetStep && currentStep.id < targetStep.id) {
              return true;
            }

            return false;
          };

          if (isBackward()) {
            dispatchEvent("Popped", {});

            if (!nextActivity) {
              pushFlag += 1;
              push({
                ...targetActivity.pushedBy,
              });

              if (
                targetStep?.pushedBy.name === "StepPushed" ||
                targetStep?.pushedBy.name === "StepReplaced"
              ) {
                pushFlag += 1;
                stepPush({
                  ...targetStep.pushedBy,
                });
              }
            }
          }
          if (isStepBackward()) {
            if (
              !nextStep &&
              targetStep &&
              (targetStep?.pushedBy.name === "StepPushed" ||
                targetStep?.pushedBy.name === "StepReplaced")
            ) {
              pushFlag += 1;
              stepPush({
                ...targetStep.pushedBy,
              });
            }

            dispatchEvent("StepPopped", {});
          }

          if (isForward()) {
            pushFlag += 1;
            push({
              activityId: targetActivity.id,
              activityName: targetActivity.name,
              activityParams: targetActivity.params,
            });
          }
          if (isStepForward()) {
            if (!targetStep) {
              return;
            }

            pushFlag += 1;
            stepPush({
              stepId: targetStep.id,
              stepParams: targetStep.params,
            });
          }
        };

        if (!isServer) {
          window.addEventListener("popstate", onPopState);
        }
      },
      onPushed({ effect: { activity } }) {
        if (pushFlag) {
          pushFlag -= 1;
          return;
        }

        const template = makeTemplate(
          normalizeRoute(options.routes[activity.name])[0],
        );

        pushState({
          url: template.fill(activity.params),
          state: {
            _TAG: STATE_TAG,
            activity: removeActivityContext(activity),
          },
          useHash: options.useHash,
        });
      },
      onStepPushed({ effect: { activity, step } }) {
        if (pushFlag) {
          pushFlag -= 1;
          return;
        }

        const template = makeTemplate(
          normalizeRoute(options.routes[activity.name])[0],
        );

        pushState({
          url: template.fill(activity.params),
          state: {
            _TAG: STATE_TAG,
            activity: removeActivityContext(activity),
            step,
          },
          useHash: options.useHash,
        });
      },
      onReplaced({ effect: { activity } }) {
        if (!activity.isActive) {
          return;
        }

        const template = makeTemplate(
          normalizeRoute(options.routes[activity.name])[0],
        );

        replaceState({
          url: template.fill(activity.params),
          state: {
            _TAG: STATE_TAG,
            activity: removeActivityContext(activity),
          },
          useHash: options.useHash,
        });
      },
      onStepReplaced({ effect: { activity, step } }) {
        if (!activity.isActive) {
          return;
        }

        const template = makeTemplate(
          normalizeRoute(options.routes[activity.name])[0],
        );

        replaceState({
          url: template.fill(activity.params),
          state: {
            _TAG: STATE_TAG,
            activity: removeActivityContext(activity),
            step,
          },
          useHash: options.useHash,
        });
      },
      onBeforePush({ actionParams, actions: { overrideActionParams } }) {
        const template = makeTemplate(
          normalizeRoute(options.routes[actionParams.activityName])[0],
        );
        const path = template.fill(actionParams.activityParams);

        overrideActionParams({
          ...actionParams,
          activityContext: {
            ...actionParams.activityContext,
            path,
          },
        });
      },
      onBeforeReplace({ actionParams, actions: { overrideActionParams } }) {
        const template = makeTemplate(
          normalizeRoute(options.routes[actionParams.activityName])[0],
        );
        const path = template.fill(actionParams.activityParams);

        overrideActionParams({
          ...actionParams,
          activityContext: {
            ...actionParams.activityContext,
            path,
          },
        });
      },
      onBeforePop({ actions: { getStack } }) {
        if (typeof window === "undefined") {
          return;
        }

        const { activities } = getStack();
        const currentActivity = activities.find(
          (activity) => activity.isActive,
        );
        const popCount = currentActivity?.steps.length ?? 0;

        popFlag += popCount;

        do {
          for (let i = 0; i < popCount; i += 1) {
            window.history.back();
          }
        } while (!parseState(getCurrentState()));
      },
    };
  };
}
