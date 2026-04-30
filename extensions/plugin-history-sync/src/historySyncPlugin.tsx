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
import { coerceParamsToString } from "./coerceParamsToString";
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
          // FEP-1061: cross-deploy hydration. `initialState` was serialized by
          // some earlier plugin version (possibly pre-FEP-1061) and may carry
          // typed values in `activityParams` / `stepParams`. Coerce here so the
          // 7th entry path (parseState early-return) also enforces the
          // string-only invariant. Within-deploy this is idempotent — the
          // writer already coerced.
          return [
            {
              ...initialState.activity.enteredBy,
              name: "Pushed",
              activityParams: coerceParamsToString(
                initialState.activity.enteredBy.activityParams,
              ),
            },
            ...(initialState.step?.enteredBy.name === "StepPushed" ||
            initialState.step?.enteredBy.name === "StepReplaced"
              ? [
                  {
                    ...initialState.step.enteredBy,
                    name: "StepPushed" as const,
                    stepParams: coerceParamsToString(
                      initialState.step.enteredBy.stepParams,
                    ),
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
        )[] => {
          // FEP-1061 (Option B, B8): per-ancestor URL via the ancestor's
          // own route encode (was previously `currentPath`, which leaked
          // the URL the user arrived on into all ancestor entries).
          const ancestorRoute = activityRoutes.find(
            (r) => r.activityName === activityName,
          );
          const ancestorTemplate = ancestorRoute
            ? makeTemplate(ancestorRoute, options.urlPatternOptions)
            : null;
          const ancestorActivityPath = ancestorTemplate
            ? ancestorTemplate.fill(activityParams)
            : currentPath;

          return [
            {
              name: "Pushed",
              id: id(),
              activityId: id(),
              activityName,
              activityParams: coerceParamsToString(activityParams),
              activityContext: {
                path: ancestorActivityPath,
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
                stepParams: coerceParamsToString(stepParams),
                ...(ancestorTemplate
                  ? {
                      stepContext: {
                        path: ancestorTemplate.fill(stepParams),
                      },
                    }
                  : {}),
                hasZIndex,
              }),
            ),
          ];
        };
        const createTargetActivityPushEvent = (): Omit<
          PushedEvent,
          "eventDate"
        > => {
          const targetTemplate = makeTemplate(
            targetActivityRoute,
            options.urlPatternOptions,
          );
          const matched = targetTemplate.parse(currentPath);
          const targetParams =
            matched ?? urlSearchParamsToMap(pathToUrl(currentPath).searchParams);
          // FEP-1061 (Option B, B8): when the URL matched the target route,
          // use currentPath (the user's URL); when fallback was triggered
          // (no match), compute the target route's URL from its template
          // so onInit writes a route-correct URL (was previously
          // currentPath, e.g. "/" instead of "/home/").
          const targetPath = matched
            ? currentPath
            : targetTemplate.fill(targetParams);
          return {
            name: "Pushed",
            id: id(),
            activityId: id(),
            activityName: targetActivityRoute.activityName,
            activityParams: coerceParamsToString(targetParams),
            activityContext: {
              path: targetPath,
              lazyActivityComponentRenderContext: {
                shouldRenderImmediately: true,
              },
            },
          };
        };

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

              // FEP-1061 (Option B): trust activity.context.path (computed by
              // onBeforePush from typed params before coercion, or set by SSR)
              // and fall back to fillWithoutEncode only when missing.
              const activityPath =
                (activity.context as { path?: string } | undefined)?.path ??
                template.fillWithoutEncode(activity.params);

              if (activity.isRoot) {
                replaceState({
                  history,
                  pathname: activityPath,
                  state: {
                    activity: activity,
                  },
                  useHash: options.useHash,
                });
              } else {
                pushState({
                  history,
                  pathname: activityPath,
                  state: {
                    activity: activity,
                  },
                  useHash: options.useHash,
                });
              }

              for (const step of activity.steps) {
                if (!step.exitedBy && step.enteredBy.name !== "Pushed") {
                  // FEP-1061 (Option B): trust step.context.path (set by
                  // onBeforeStepPush from typed params), fall back otherwise.
                  const stepPath =
                    (step.context as { path?: string } | undefined)?.path ??
                    template.fillWithoutEncode(step.params);
                  pushState({
                    history,
                    pathname: stepPath,
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
              // FEP-1061 (Option B, B4): preserve the encoded path through
              // popstate-forward re-push so onBeforePush's "skip when path
              // already present" branch fires and encode is NOT re-run on
              // the coerced strings.
              activityContext: targetActivity.context,
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
              // FEP-1061 (Option B, B7): preserve the encoded step path
              // through popstate-stepForward re-push.
              stepContext: targetStep.context,
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

        // FEP-1061 (Option B, B3): trust activity.context.path written by
        // onBeforePush (which ran encode on the typed params before
        // coercion). Fall back to fillWithoutEncode only when missing
        // (e.g. plugin re-emits Pushed without activityContext — see
        // T-O-13 pin).
        const pathname =
          (activity.context as { path?: string } | undefined)?.path ??
          template.fillWithoutEncode(activity.params);

        requestHistoryTick(() => {
          silentFlag = true;
          pushState({
            history,
            pathname,
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

        // FEP-1061 (Option B, B6): trust step.context.path written by
        // onBeforeStepPush. Fall back to fillWithoutEncode(activity.params)
        // when missing — note this matches the pre-fix shape, which used
        // activity.params (the latest set, often equal to step params),
        // preserving behavior on the fallback path.
        const pathname =
          (step.context as { path?: string } | undefined)?.path ??
          template.fillWithoutEncode(activity.params);

        requestHistoryTick(() => {
          silentFlag = true;
          pushState({
            history,
            pathname,
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

        // FEP-1061 (Option B, B3): see onPushed — same pattern.
        const pathname =
          (activity.context as { path?: string } | undefined)?.path ??
          template.fillWithoutEncode(activity.params);

        requestHistoryTick(() => {
          silentFlag = true;
          replaceState({
            history,
            pathname,
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

        // FEP-1061 (Option B, B6): see onStepPushed — same pattern.
        const pathname =
          (step.context as { path?: string } | undefined)?.path ??
          template.fillWithoutEncode(activity.params);

        requestHistoryTick(() => {
          silentFlag = true;
          replaceState({
            history,
            pathname,
            state: {
              activity,
              step,
            },
            useHash: options.useHash,
          });
        });
      },
      onBeforePush({ actionParams, actions: { overrideActionParams } }) {
        const needsPath =
          !actionParams.activityContext ||
          "path" in actionParams.activityContext === false;

        // `template.fill` runs `encode` on the typed params U. We must call
        // it BEFORE coercing so `encode` sees the original typed values
        // (FEP-1061 contract).
        let path: string | undefined;
        if (needsPath) {
          const match = activityRoutes.find(
            (r) => r.activityName === actionParams.activityName,
          )!;
          const template = makeTemplate(match, options.urlPatternOptions);
          path = template.fill(actionParams.activityParams);
        }

        // FEP-1061: single `overrideActionParams` call so the path set above
        // survives alongside the coerced `activityParams`. `core`'s
        // `overrideActionParams` is a spread-merge, so splitting into two
        // calls where the second spreads the ORIGINAL `actionParams` would
        // clobber the just-set `activityContext.path`.
        overrideActionParams({
          ...actionParams,
          ...(needsPath
            ? {
                activityContext: {
                  ...actionParams.activityContext,
                  path,
                },
              }
            : {}),
          activityParams: coerceParamsToString(actionParams.activityParams),
        });
      },
      onBeforeReplace({
        actionParams,
        actions: { overrideActionParams, getStack },
      }) {
        const needsPath =
          !actionParams.activityContext ||
          "path" in actionParams.activityContext === false;

        // See `onBeforePush` — `encode` must run on typed params first, and
        // the single-call shape preserves path alongside coerced params.
        let path: string | undefined;
        if (needsPath) {
          const match = activityRoutes.find(
            (r) => r.activityName === actionParams.activityName,
          )!;
          const template = makeTemplate(match, options.urlPatternOptions);
          path = template.fill(actionParams.activityParams);
        }

        overrideActionParams({
          ...actionParams,
          ...(needsPath
            ? {
                activityContext: {
                  ...actionParams.activityContext,
                  path,
                },
              }
            : {}),
          activityParams: coerceParamsToString(actionParams.activityParams),
        });

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
      onBeforeStepPush({
        actionParams,
        actions: { getStack, overrideActionParams },
      }) {
        // FEP-1061 (Option B, B5): if the caller already supplied a
        // stepContext.path (e.g. popstate stepForward branch), preserve it.
        // Otherwise compute it via the active activity's route template
        // running encode on the TYPED params before coercion. If no active
        // activity exists at dispatch time (initial boot / cross-deploy
        // hydration before the parent Pushed materializes), gracefully
        // skip path computation — the post-effect will fall back to
        // fillWithoutEncode (Architect N3/N4).
        const ctx = actionParams.stepContext as
          | { path?: string }
          | undefined;
        const hasExistingPath = !!ctx && "path" in ctx;

        let path: string | undefined;
        if (hasExistingPath) {
          path = ctx?.path;
        } else {
          const stack = getStack();
          const activeActivity = stack.activities.find((a) => a.isActive);
          if (activeActivity) {
            const match = activityRoutes.find(
              (r) => r.activityName === activeActivity.name,
            );
            if (match) {
              const template = makeTemplate(match, options.urlPatternOptions);
              path = template.fill(actionParams.stepParams);
            }
          }
          // else: no active activity (initial boot / cross-deploy
          // hydration before parent Pushed). Leave path undefined; the
          // post-effect fallback applies (fillWithoutEncode).
        }

        overrideActionParams({
          ...actionParams,
          ...(path !== undefined
            ? {
                stepContext: {
                  ...(actionParams.stepContext as Record<string, unknown>),
                  path,
                },
              }
            : {}),
          stepParams: coerceParamsToString(actionParams.stepParams),
        });
      },
      onBeforeStepReplace({
        actionParams,
        actions: { getStack, overrideActionParams },
      }) {
        // FEP-1061 (Option B, B5): mirror onBeforeStepPush.
        const ctx = actionParams.stepContext as
          | { path?: string }
          | undefined;
        const hasExistingPath = !!ctx && "path" in ctx;

        let path: string | undefined;
        if (hasExistingPath) {
          path = ctx?.path;
        } else {
          const stack = getStack();
          const activeActivity = stack.activities.find((a) => a.isActive);
          if (activeActivity) {
            const match = activityRoutes.find(
              (r) => r.activityName === activeActivity.name,
            );
            if (match) {
              const template = makeTemplate(match, options.urlPatternOptions);
              path = template.fill(actionParams.stepParams);
            }
          }
        }

        overrideActionParams({
          ...actionParams,
          ...(path !== undefined
            ? {
                stepContext: {
                  ...(actionParams.stepContext as Record<string, unknown>),
                  path,
                },
              }
            : {}),
          stepParams: coerceParamsToString(actionParams.stepParams),
        });
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
