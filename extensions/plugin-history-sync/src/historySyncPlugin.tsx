import type {
  ActivityDefinition,
  Config,
  RegisteredActivityName,
} from "@stackflow/config";
import {
  id,
  type PushedEvent,
  type Stack,
  type StepPushedEvent,
} from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";
import type { ActivityComponentType } from "@stackflow/react/future";
import type { History, Listener } from "history";
import { createBrowserHistory, createMemoryHistory } from "history";
import { useSyncExternalStore } from "react";
import UrlPattern from "url-pattern";
import { ActivityActivationCountsContext } from "./ActivityActivationCountsContext";
import type { ActivityActivationMonitor } from "./ActivityActivationMonitor/ActivityActivationMonitor";
import { DefaultHistoryActivityActivationMonitor } from "./ActivityActivationMonitor/DefaultHistoryActivityActivationMonitor";
import { HistoryQueueProvider } from "./HistoryQueueContext";
import { parseState, pushState, replaceState } from "./historyState";
import { last } from "./last";
import { makeHistoryTaskQueue } from "./makeHistoryTaskQueue";
import type { UrlPatternOptions } from "./makeTemplate";
import { makeTemplate, pathToUrl, urlSearchParamsToMap } from "./makeTemplate";
import type { NavigationProcess } from "./NavigationProcess/NavigationProcess";
import { SerialNavigationProcess } from "./NavigationProcess/SerialNavigationProcess";
import { normalizeActivityRouteMap } from "./normalizeActivityRouteMap";
import { Publisher } from "./Publisher";
import {
  type HistoryEntry,
  interpretDefaultHistoryOption,
  type RouteLike,
} from "./RouteLike";
import { RoutesProvider } from "./RoutesContext";
import { sortActivityRoutes } from "./sortActivityRoutes";

type ConfigHistorySync = {
  makeTemplate: typeof makeTemplate;
  urlPatternOptions?: UrlPatternOptions;
};

declare module "@stackflow/config" {
  interface ActivityDefinition<ActivityName extends RegisteredActivityName> {
    route: RouteLike<ActivityComponentType<RegisteredActivityName>>;
  }

  interface Config<T extends ActivityDefinition<RegisteredActivityName>> {
    historySync?: ConfigHistorySync;
  }
}

type HistorySyncPluginOptions<T, K extends Extract<keyof T, string>> = (
  | {
      routes: {
        [key in keyof T]: RouteLike<T[key]>;
      };
    }
  | {
      config: Config<ActivityDefinition<RegisteredActivityName>>;
    }
) & {
  fallbackActivity: (args: { initialContext: any }) => K;
  useHash?: boolean;
  history?: History;
  urlPatternOptions?: UrlPatternOptions;
};

export function historySyncPlugin<
  T extends { [activityName: string]: unknown },
  K extends Extract<keyof T, string>,
>(options: HistorySyncPluginOptions<T, K>): StackflowReactPlugin<T> {
  if ("config" in options) {
    options.config.decorate("historySync", {
      makeTemplate,
      urlPatternOptions: options.urlPatternOptions,
    });
  }

  const history =
    options.history ??
    (typeof window === "undefined"
      ? createMemoryHistory({})
      : createBrowserHistory({
          window,
        }));

  const { location } = history;

  const routes =
    "routes" in options
      ? options.routes
      : options.config.activities.reduce(
          (acc, a) => ({ ...acc, [a.name]: a.route }),
          {},
        );

  const activityRoutes = sortActivityRoutes(normalizeActivityRouteMap(routes));

  return () => {
    let pushFlag = 0;
    let silentFlag = false;
    let initialSetupProcess: NavigationProcess | null = null;
    const activityActivationMonitors: ActivityActivationMonitor[] = [];
    const activityActivationCountsChangeNotifier = new Publisher<void>();

    const { requestHistoryTick } = makeHistoryTaskQueue(history);

    const subscribeActivityActivationCountsChange = (
      subscriber: () => void,
    ) => {
      return activityActivationCountsChangeNotifier.subscribe(async () =>
        subscriber(),
      );
    };

    let cachedActivityActivationCounts:
      | { activityId: string; activationCount: number }[]
      | null = null;
    const getActivityActivationCounts = () => {
      const currentActivityActivationCounts = activityActivationMonitors.map(
        (activityActivationMonitor) => ({
          activityId: activityActivationMonitor.getTargetId(),
          activationCount: activityActivationMonitor.getActivationCount(),
        }),
      );

      if (
        !cachedActivityActivationCounts ||
        cachedActivityActivationCounts.length !==
          currentActivityActivationCounts.length ||
        cachedActivityActivationCounts.some(
          ({
            activityId: cachedActivityId,
            activationCount: cachedActivationCount,
          }) =>
            currentActivityActivationCounts.some(
              ({ activityId, activationCount }) =>
                activityId === cachedActivityId &&
                activationCount !== cachedActivationCount,
            ),
        )
      ) {
        cachedActivityActivationCounts = currentActivityActivationCounts;
      }

      return cachedActivityActivationCounts;
    };

    const runActivityActivationMonitors = (stack: Stack) => {
      let changeOccurred = false;

      for (const activityActivationMonitor of activityActivationMonitors) {
        const previousActivationCount =
          activityActivationMonitor.getActivationCount();

        activityActivationMonitor.captureStackChange(stack);

        if (
          previousActivationCount !==
          activityActivationMonitor.getActivationCount()
        ) {
          changeOccurred = true;
        }
      }

      if (changeOccurred) {
        activityActivationCountsChangeNotifier.publish();
      }
    };

    return {
      key: "plugin-history-sync",
      wrapStack({ stack }) {
        const activityActivationCounts = useSyncExternalStore(
          subscribeActivityActivationCountsChange,
          getActivityActivationCounts,
          getActivityActivationCounts,
        );

        return (
          <HistoryQueueProvider requestHistoryTick={requestHistoryTick}>
            <RoutesProvider routes={activityRoutes}>
              <ActivityActivationCountsContext.Provider
                value={activityActivationCounts}
              >
                {stack.render()}
              </ActivityActivationCountsContext.Provider>
            </RoutesProvider>
          </HistoryQueueProvider>
        );
      },
      overrideInitialEvents({ initialContext }) {
        const initialState = parseState(history.location.state);

        if (initialState) {
          return [
            {
              ...initialState.activity.enteredBy,
              name: "Pushed",
            },
            ...(initialState.step?.enteredBy.name === "StepPushed" ||
            initialState.step?.enteredBy.name === "StepReplaced"
              ? [
                  {
                    ...initialState.step.enteredBy,
                    name: "StepPushed" as const,
                  },
                ]
              : []),
          ];
        }

        function resolveCurrentPath() {
          if (
            initialContext?.req?.path &&
            typeof initialContext.req.path === "string"
          ) {
            return initialContext.req.path;
          }

          if (options.useHash) {
            return location.hash.split("#")[1] ?? "/";
          }

          return location.pathname + location.search;
        }

        const currentPath = resolveCurrentPath();
        const fallbackActivityName = options.fallbackActivity({
          initialContext,
        });
        const targetActivityRoute =
          activityRoutes.find((activityRoute) => {
            const template = makeTemplate(
              activityRoute,
              options.urlPatternOptions,
            );
            const activityParams = template.parse(currentPath);

            return activityParams !== null;
          }) ??
          activityRoutes.find(
            (activityRoute) =>
              activityRoute.activityName === fallbackActivityName,
          )!;
        const pattern = new UrlPattern(
          `${targetActivityRoute.path}(/)`,
          options.urlPatternOptions,
        );
        const url = pathToUrl(currentPath);
        const pathParams = pattern.match(url.pathname);
        const searchParams = urlSearchParamsToMap(url.searchParams);
        const params = {
          ...searchParams,
          ...pathParams,
        };
        const defaultHistory = interpretDefaultHistoryOption(
          targetActivityRoute.defaultHistory,
          params,
        );
        const historyEntryToEvents = ({
          activityName,
          activityParams,
          additionalSteps = [],
        }: HistoryEntry): (
          | Omit<PushedEvent, "eventDate">
          | Omit<StepPushedEvent, "eventDate">
        )[] => [
          {
            name: "Pushed",
            id: id(),
            activityId: id(),
            activityName,
            activityParams: {
              ...activityParams,
            },
            activityContext: {
              path: currentPath,
              lazyActivityComponentRenderContext: {
                shouldRenderImmediately: true,
              },
            },
          },
          ...additionalSteps.map(
            ({
              stepParams,
              hasZIndex,
            }): Omit<StepPushedEvent, "eventDate"> => ({
              name: "StepPushed",
              id: id(),
              stepId: id(),
              stepParams,
              hasZIndex,
            }),
          ),
        ];
        const createTargetActivityPushEvent = (): Omit<
          PushedEvent,
          "eventDate"
        > => ({
          name: "Pushed",
          id: id(),
          activityId: id(),
          activityName: targetActivityRoute.activityName,
          activityParams:
            makeTemplate(targetActivityRoute, options.urlPatternOptions).parse(
              currentPath,
            ) ?? urlSearchParamsToMap(pathToUrl(currentPath).searchParams),
          activityContext: {
            path: currentPath,
            lazyActivityComponentRenderContext: {
              shouldRenderImmediately: true,
            },
          },
        });

        if (defaultHistory.skipDefaultHistorySetupTransition) {
          initialSetupProcess = new SerialNavigationProcess([
            () => [
              ...defaultHistory.entries.flatMap((historyEntry) =>
                historyEntryToEvents(historyEntry).map((event) => {
                  if (event.name !== "Pushed") return event;

                  activityActivationMonitors.push(
                    new DefaultHistoryActivityActivationMonitor(
                      event.activityId,
                      initialSetupProcess!,
                    ),
                  );

                  return {
                    ...event,
                    skipEnterActiveState: true,
                  };
                }),
              ),
              {
                ...createTargetActivityPushEvent(),
                skipEnterActiveState: true,
              },
            ],
          ]);
        } else {
          initialSetupProcess = new SerialNavigationProcess([
            ...defaultHistory.entries.map((historyEntry) => () => {
              return historyEntryToEvents(historyEntry).map((event) => {
                if (event.name !== "Pushed") return event;

                activityActivationMonitors.push(
                  new DefaultHistoryActivityActivationMonitor(
                    event.activityId,
                    initialSetupProcess!,
                  ),
                );

                return {
                  ...event,
                };
              });
            }),
            () => [createTargetActivityPushEvent()],
          ]);
        }

        const now = Date.now();
        const initialEvents = initialSetupProcess
          .captureNavigationOpportunity(null)
          .map((event, index, array) => ({
            ...event,
            eventDate: now - (array.length - index),
          }));
        const firstPushEvent = initialEvents.find(
          (event) => event.name === "Pushed",
        );

        return initialEvents.map((event) => {
          if (event.id !== firstPushEvent?.id) return event;

          return {
            ...event,
            skipEnterActiveState: true,
          };
        });
      },
      onInit({ actions: { getStack, dispatchEvent, push, stepPush } }) {
        const stack = getStack();

        if (parseState(history.location.state) === null) {
          for (const activity of stack.activities) {
            if (
              activity.transitionState === "enter-active" ||
              activity.transitionState === "enter-done"
            ) {
              const match = activityRoutes.find(
                (r) => r.activityName === activity.name,
              )!;
              const template = makeTemplate(match, options.urlPatternOptions);

              if (activity.isRoot) {
                replaceState({
                  history,
                  pathname: template.fill(activity.params),
                  state: {
                    activity: activity,
                  },
                  useHash: options.useHash,
                });
              } else {
                pushState({
                  history,
                  pathname: template.fill(activity.params),
                  state: {
                    activity: activity,
                  },
                  useHash: options.useHash,
                });
              }

              for (const step of activity.steps) {
                if (!step.exitedBy && step.enteredBy.name !== "Pushed") {
                  pushState({
                    history,
                    pathname: template.fill(step.params),
                    state: {
                      activity: activity,
                      step: step,
                    },
                    useHash: options.useHash,
                  });
                }
              }
            }
          }
        }

        const onPopState: Listener = (e) => {
          if (silentFlag) {
            silentFlag = false;
            return;
          }

          const state = parseState(e.location.state);

          if (!state) {
            return;
          }

          const targetActivity = state.activity;
          const targetActivityId = state.activity.id;
          const targetStep = state.step;

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
                ...targetActivity.enteredBy,
              });

              if (
                targetStep?.enteredBy.name === "StepPushed" ||
                targetStep?.enteredBy.name === "StepReplaced"
              ) {
                const { enteredBy } = targetStep;
                pushFlag += 1;
                stepPush({
                  ...enteredBy,
                });
              }
            }
          }
          if (isStepBackward()) {
            if (
              !nextStep &&
              targetStep &&
              (targetStep?.enteredBy.name === "StepPushed" ||
                targetStep?.enteredBy.name === "StepReplaced")
            ) {
              const { enteredBy } = targetStep;

              pushFlag += 1;
              stepPush({
                ...enteredBy,
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

        history.listen(onPopState);

        initialSetupProcess
          ?.captureNavigationOpportunity(stack)
          .forEach((event) =>
            event.name === "Pushed" ? push(event) : stepPush(event),
          );

        runActivityActivationMonitors(stack);
      },
      onPushed({ effect: { activity } }) {
        if (pushFlag) {
          pushFlag -= 1;
          return;
        }

        const match = activityRoutes.find(
          (r) => r.activityName === activity.name,
        )!;

        const template = makeTemplate(match, options.urlPatternOptions);

        requestHistoryTick(() => {
          silentFlag = true;
          pushState({
            history,
            pathname: template.fill(activity.params),
            state: {
              activity,
            },
            useHash: options.useHash,
          });
        });
      },
      onStepPushed({ effect: { activity, step } }) {
        if (pushFlag) {
          pushFlag -= 1;
          return;
        }

        const match = activityRoutes.find(
          (r) => r.activityName === activity.name,
        )!;

        const template = makeTemplate(match, options.urlPatternOptions);

        requestHistoryTick(() => {
          silentFlag = true;
          pushState({
            history,
            pathname: template.fill(activity.params),
            state: {
              activity,
              step,
            },
            useHash: options.useHash,
          });
        });
      },
      onReplaced({ effect: { activity } }) {
        if (!activity.isActive) {
          return;
        }

        const match = activityRoutes.find(
          (r) => r.activityName === activity.name,
        )!;

        const template = makeTemplate(match, options.urlPatternOptions);

        requestHistoryTick(() => {
          silentFlag = true;
          replaceState({
            history,
            pathname: template.fill(activity.params),
            state: {
              activity,
            },
            useHash: options.useHash,
          });
        });
      },
      onStepReplaced({ effect: { activity, step } }) {
        if (!activity.isActive) {
          return;
        }

        const match = activityRoutes.find(
          (r) => r.activityName === activity.name,
        )!;

        const template = makeTemplate(match, options.urlPatternOptions);

        requestHistoryTick(() => {
          silentFlag = true;
          replaceState({
            history,
            pathname: template.fill(activity.params),
            state: {
              activity,
              step,
            },
            useHash: options.useHash,
          });
        });
      },
      onBeforePush({ actionParams, actions: { overrideActionParams } }) {
        if (
          !actionParams.activityContext ||
          "path" in actionParams.activityContext === false
        ) {
          const match = activityRoutes.find(
            (r) => r.activityName === actionParams.activityName,
          )!;
          const template = makeTemplate(match, options.urlPatternOptions);
          const path = template.fill(actionParams.activityParams);

          overrideActionParams({
            ...actionParams,
            activityContext: {
              ...actionParams.activityContext,
              path,
            },
          });
        }
      },
      onBeforeReplace({
        actionParams,
        actions: { overrideActionParams, getStack },
      }) {
        if (
          !actionParams.activityContext ||
          "path" in actionParams.activityContext === false
        ) {
          const match = activityRoutes.find(
            (r) => r.activityName === actionParams.activityName,
          )!;
          const template = makeTemplate(match, options.urlPatternOptions);
          const path = template.fill(actionParams.activityParams);

          overrideActionParams({
            ...actionParams,
            activityContext: {
              ...actionParams.activityContext,
              path,
            },
          });
        }

        const { activities } = getStack();
        const enteredActivities = activities.filter(
          (currentActivity) =>
            currentActivity.transitionState === "enter-active" ||
            currentActivity.transitionState === "enter-done",
        );
        const previousActivity =
          enteredActivities.length > 0
            ? enteredActivities[enteredActivities.length - 1]
            : null;

        if (previousActivity) {
          for (let i = 0; i < previousActivity.steps.length - 1; i += 1) {
            requestHistoryTick((resolve) => {
              if (!parseState(history.location.state)) {
                silentFlag = true;
                history.back();
              } else {
                resolve();
              }
            });

            requestHistoryTick(() => {
              silentFlag = true;
              history.back();
            });
          }
        }
      },
      onBeforeStepPop({ actions: { getStack } }) {
        const { activities } = getStack();
        const currentActivity = activities.find(
          (activity) => activity.isActive,
        );

        if ((currentActivity?.steps.length ?? 0) > 1) {
          requestHistoryTick(() => {
            silentFlag = true;
            history.back();
          });
        }
      },
      onBeforePop({ actions: { getStack } }) {
        const { activities } = getStack();
        const currentActivity = activities.find(
          (activity) => activity.isActive,
        );

        if (currentActivity) {
          const { isRoot, steps } = currentActivity;

          const popCount = isRoot ? 0 : steps.length;

          for (let i = 0; i < popCount; i += 1) {
            requestHistoryTick((resolve) => {
              if (!parseState(history.location.state)) {
                silentFlag = true;
                history.back();
              } else {
                resolve();
              }
            });

            requestHistoryTick(() => {
              silentFlag = true;
              history.back();
            });
          }
        }
      },
      onChanged({ actions: { getStack, push, stepPush } }) {
        const stack = getStack();

        initialSetupProcess
          ?.captureNavigationOpportunity(stack)
          .forEach((event) =>
            event.name === "Pushed" ? push(event) : stepPush(event),
          );

        runActivityActivationMonitors(stack);
      },
    };
  };
}
