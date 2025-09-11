import type {
  ActivityDefinition,
  Config,
  RegisteredActivityName,
} from "@stackflow/config";
import { id, makeEvent } from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";
import type { ActivityComponentType } from "@stackflow/react/future";
import type { History, Listener } from "history";
import { createBrowserHistory, createMemoryHistory } from "history";
import UrlPattern from "url-pattern";
import { DefaultHistorySetupProcess } from "./DefaultHistorySetupProcess";
import { HistoryQueueProvider } from "./HistoryQueueContext";
import { parseState, pushState, replaceState } from "./historyState";
import { last } from "./last";
import { makeHistoryTaskQueue } from "./makeHistoryTaskQueue";
import type { UrlPatternOptions } from "./makeTemplate";
import { makeTemplate, pathToUrl, urlSearchParamsToMap } from "./makeTemplate";
import { normalizeActivityRouteMap } from "./normalizeActivityRouteMap";
import type { RouteLike } from "./RouteLike";
import { RoutesProvider } from "./RoutesContext";
import { sortActivityRoutes } from "./sortActivityRoutes";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

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
    let defaultHistorySetupProcess: DefaultHistorySetupProcess | null = null;

    const { requestHistoryTick } = makeHistoryTaskQueue(history);

    return {
      key: "plugin-history-sync",
      wrapStack({ stack }) {
        return (
          <HistoryQueueProvider requestHistoryTick={requestHistoryTick}>
            <RoutesProvider routes={activityRoutes}>
              {stack.render()}
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
        const defaultHistory =
          targetActivityRoute.defaultHistory?.(params) ?? [];

        if (defaultHistory[0]) {
          defaultHistorySetupProcess = new DefaultHistorySetupProcess(
            [defaultHistory[0], ...defaultHistory.slice(1)],
            currentPath,
            ({ push }) => {
              const template = makeTemplate(
                targetActivityRoute,
                options.urlPatternOptions,
              );
              const activityParams =
                template.parse(currentPath) ??
                urlSearchParamsToMap(pathToUrl(currentPath).searchParams);
              const activityId = id();

              push({
                activityId,
                activityName: targetActivityRoute.activityName,
                activityParams: {
                  ...activityParams,
                },
                activityContext: {
                  path: currentPath,
                  lazyActivityComponentRenderContext: {
                    shouldRenderImmediately: true,
                  },
                },
              });
            },
          );

          return defaultHistorySetupProcess.initialEvents;
        }

        const template = makeTemplate(
          targetActivityRoute,
          options.urlPatternOptions,
        );
        const activityParams =
          template.parse(currentPath) ??
          urlSearchParamsToMap(pathToUrl(currentPath).searchParams);

        return [
          makeEvent("Pushed", {
            activityId: id(),
            activityName: targetActivityRoute.activityName,
            activityParams: {
              ...activityParams,
            },
            eventDate: Date.now() - MINUTE,
            activityContext: {
              path: currentPath,
              lazyActivityComponentRenderContext: {
                shouldRenderImmediately: true,
              },
            },
          }),
        ];
      },
      onInit({ actions }) {
        const { getStack, dispatchEvent, push, stepPush } = actions;
        const rootActivity = getStack().activities[0];

        const match = activityRoutes.find(
          (r) => r.activityName === rootActivity.name,
        )!;
        const template = makeTemplate(match, options.urlPatternOptions);

        const lastStep = last(rootActivity.steps);

        requestHistoryTick(() => {
          silentFlag = true;
          replaceState({
            history,
            pathname: template.fill(rootActivity.params),
            state: {
              activity: rootActivity,
              step: lastStep,
            },
            useHash: options.useHash,
          });
        });

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

        defaultHistorySetupProcess?.captureNavigationOpportunity(actions);
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
      onChanged({ actions }) {
        defaultHistorySetupProcess?.captureNavigationOpportunity(actions);
      },
    };
  };
}
