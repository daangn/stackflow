import type {
  ActivityDefinition,
  Config,
  RegisteredActivityName,
} from "@stackflow/config";
import {
  type Activity,
  type ActivityStep,
  id,
  type PushedEvent,
  type Stack,
  type StackflowActions,
  type StepPushedEvent,
} from "@stackflow/core";
import type {
  ActivityComponentType,
  StackflowReactPlugin,
} from "@stackflow/react";
import type { History } from "history";
import { createBrowserHistory, createMemoryHistory } from "history";
import { useEffect, useSyncExternalStore } from "react";
import UrlPattern from "url-pattern";
import { ActivityActivationCountsContext } from "./ActivityActivationCountsContext";
import type { ActivityActivationMonitor } from "./ActivityActivationMonitor/ActivityActivationMonitor";
import { DefaultHistoryActivityActivationMonitor } from "./ActivityActivationMonitor/DefaultHistoryActivityActivationMonitor";
import { identityOfState } from "./BrowserHistoryEntryModel";
import { computeDesiredHistoryEntries } from "./desiredHistoryEntries";
import { HistoryQueueProvider } from "./HistoryQueueContext";
import { HistoryReconciler } from "./HistoryReconciler";
import { getStateStepId, parseState, type State } from "./historyState";
import { last } from "./last";
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

/**
 * Defensive bound on navigation dispatch loops driven by a single popstate.
 * A loop that does not shrink the stack (the core refused an event the model
 * predicted it would accept) must bail out instead of spinning; the follow-up
 * reconcile pass restores consistency.
 */
const MAX_NAVIGATION_DISPATCHES = 100;

function isEnteredActivity(activity: Activity): boolean {
  return (
    activity.transitionState === "enter-active" ||
    activity.transitionState === "enter-done"
  );
}

/**
 * Entered activities in navigation order (`enteredBy.eventDate`). Note that
 * the core's `isActive`/render order follows the `activities` array slot
 * order instead; the two agree for every navigation this plugin dispatches —
 * see the ordering note in `desiredHistoryEntries.ts`.
 */
function enteredActivitiesOf(stack: Stack): Activity[] {
  return stack.activities
    .filter(isEnteredActivity)
    .sort((a, b) => a.enteredBy.eventDate - b.enteredBy.eventDate);
}

function activeActivityOf(stack: Stack): Activity | undefined {
  return last(enteredActivitiesOf(stack));
}

function liveStepsOf(activity: Activity): ActivityStep[] {
  return activity.steps.filter((step) => !step.exitedBy);
}

function isStepEnteredBy(
  step: ActivityStep,
): step is ActivityStep & { enteredBy: StepPushedEvent } {
  return (
    step.enteredBy.name === "StepPushed" ||
    step.enteredBy.name === "StepReplaced"
  );
}

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
    let initialSetupProcess: NavigationProcess | null = null;
    const activityActivationMonitors: ActivityActivationMonitor[] = [];
    const activityActivationCountsChangeNotifier = new Publisher<void>();

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

    /**
     * The `defaultHistory` setup kickoff (see `dispatchInitialSetupNavigation`)
     * needs the core `actions` to dispatch navigation, but it runs inside
     * `wrapStack`'s post-commit effect, which is not passed `actions`. So we
     * capture them here from `onInit` — the earliest hook that receives
     * `actions` — and read them back in that effect.
     *
     * The ordering is guaranteed: `onInit` runs synchronously via `store.init()`
     * during the first client render (before any effect), while the effect that
     * reads `coreActions` runs after the first commit. `onInit` is browser-only,
     * so on the server neither the capture nor the effect runs.
     */
    let coreActions: StackflowActions | null = null;

    /**
     * Guards the one-time initial kickoff so React StrictMode's double-invoked
     * effect does not advance the setup process twice.
     */
    let hasDispatchedInitialSetupNavigation = false;

    /**
     * Advances the `defaultHistory` setup process by one step: dispatches the
     * next pending navigation (if any) and refreshes the activation monitors.
     * Used for the initial kickoff (from `wrapStack`'s post-commit effect) and
     * for every subsequent step (from `onChanged`).
     */
    const dispatchInitialSetupNavigation = (actions: StackflowActions) => {
      const stack = actions.getStack();

      initialSetupProcess
        ?.captureNavigationOpportunity(stack)
        .forEach((event) =>
          event.name === "Pushed"
            ? actions.push(event)
            : actions.stepPush(event),
        );

      runActivityActivationMonitors(stack);
    };

    const computeDesired = () => {
      if (!coreActions) {
        return [];
      }

      return computeDesiredHistoryEntries({
        stack: coreActions.getStack(),
        activityRoutes,
        urlPatternOptions: options.urlPatternOptions,
      });
    };

    const reconciler = new HistoryReconciler({
      history,
      useHash: options.useHash,
      computeDesired,
      onExternalPopState: (state) => handleExternalPopState(state),
    });

    /**
     * Dispatches a navigation action and reports whether it actually reached
     * the core (i.e. was not prevented by a pre-effect hook). The check works
     * by observing the recorded event log: every checked dispatch here uses a
     * fresh event date, so an accepted event always lands at the end of the
     * sorted log. Re-entrant dispatches made by other plugins' hooks (e.g. a
     * blocker pushing inside `onBlocked`) append events of *different* names
     * and do not produce false positives.
     *
     * Note: while the stack is paused, the core defers events instead of
     * recording them, so dispatches during pause read as "prevented". That is
     * the intended behavior — a frozen stack must not be navigated, and the
     * follow-up reconcile pass restores the browser to the frozen stack.
     */
    const dispatchChecked = (
      actions: StackflowActions,
      eventName: string,
      dispatch: () => void,
    ): boolean => {
      const eventCountBefore = actions.getStack().events.length;

      dispatch();

      return actions
        .getStack()
        .events.slice(eventCountBefore)
        .some((event) => event.name === eventName);
    };

    /**
     * Resolves the absolute entry index a popstate landed on. New-format
     * states carry it explicitly; states serialized by older plugin versions
     * fall back to the legacy direction inference (compare the target
     * activity/step against the active one) and assume a single-entry move.
     */
    const resolveEntryIndex = (
      state: State,
      fromIndex: number,
      actions: StackflowActions,
    ): number => {
      if (typeof state.entryIndex === "number") {
        return state.entryIndex;
      }

      const active = activeActivityOf(actions.getStack());

      if (!active) {
        return fromIndex;
      }

      if (state.activity.id !== active.id) {
        return state.activity.id < active.id ? fromIndex - 1 : fromIndex + 1;
      }

      if (!state.step) {
        return fromIndex - 1;
      }

      const currentStep = last(liveStepsOf(active));

      if (!currentStep || currentStep.id === state.step.id) {
        return fromIndex;
      }

      return state.step.id < currentStep.id ? fromIndex - 1 : fromIndex + 1;
    };

    /**
     * Backward navigation: pop down to the target entry through the formal
     * action path, so that every plugin's pre-effect hooks (including
     * `preventDefault`) participate. If any pop is prevented the dispatch
     * loop stops immediately — the unconditional reconcile pass that follows
     * every popstate then restores the browser to the (unchanged) stack.
     *
     * Entries the stack no longer knows (written before a reload) are
     * restored by re-dispatching their original entry events: `makeEvent`
     * preserves the snapshot's `id`/`eventDate`, so the events re-aggregate
     * at their historical position and the trailing pop events settle the
     * stack exactly on the target entry.
     */
    const handleBackwardNavigation = (
      state: State,
      toIndex: number,
      actions: StackflowActions,
    ): boolean => {
      const targetActivityId = state.activity.id;
      const targetStepId = getStateStepId(state);
      const isTargetActivityEntered = enteredActivitiesOf(
        actions.getStack(),
      ).some((activity) => activity.id === targetActivityId);

      if (!isTargetActivityEntered) {
        if (!dispatchChecked(actions, "Popped", () => actions.pop())) {
          return false;
        }

        actions.dispatchEvent("Pushed", {
          ...state.activity.enteredBy,
        });

        if (state.step && isStepEnteredBy(state.step)) {
          actions.dispatchEvent("StepPushed", {
            ...state.step.enteredBy,
          });
        }

        return true;
      }

      for (let i = 0; i <= MAX_NAVIGATION_DISPATCHES; i++) {
        if (i === MAX_NAVIGATION_DISPATCHES) {
          // Exhausting the bound means the stack keeps changing faster than
          // we pop towards the target — abnormal, even though the follow-up
          // reconcile pass converges the browser either way.
          console.error(
            `[plugin-history-sync] backward navigation did not reach the target activity within ${MAX_NAVIGATION_DISPATCHES} pops; converging via reconciliation instead`,
          );
          return false;
        }

        const active = activeActivityOf(actions.getStack());

        if (!active || active.id === targetActivityId) {
          break;
        }

        if (!dispatchChecked(actions, "Popped", () => actions.pop())) {
          return false;
        }

        if (activeActivityOf(actions.getStack())?.id === active.id) {
          // The core refused to pop further (e.g. only the root is left
          // while the model predicted more entries) — bail out and let the
          // reconcile pass converge.
          return false;
        }
      }

      const active = activeActivityOf(actions.getStack());

      if (!active || active.id !== targetActivityId) {
        return false;
      }

      if (liveStepsOf(active).some((step) => step.id === targetStepId)) {
        for (let i = 0; i <= MAX_NAVIGATION_DISPATCHES; i++) {
          if (i === MAX_NAVIGATION_DISPATCHES) {
            console.error(
              `[plugin-history-sync] backward navigation did not reach the target step within ${MAX_NAVIGATION_DISPATCHES} step pops; converging via reconciliation instead`,
            );
            return false;
          }

          const currentActive = activeActivityOf(actions.getStack());

          if (!currentActive) {
            return false;
          }

          const liveSteps = liveStepsOf(currentActive);

          if (last(liveSteps)?.id === targetStepId) {
            break;
          }

          if (
            !dispatchChecked(actions, "StepPopped", () => actions.stepPop())
          ) {
            return false;
          }

          if (
            liveStepsOf(activeActivityOf(actions.getStack())!).length ===
            liveSteps.length
          ) {
            return false;
          }
        }

        return true;
      }

      // The target step is not part of the current stack (its entry predates
      // a reload): pop the entries above it, then restore it at its
      // historical position.
      const stepsToPop =
        computeDesired().length - 1 - (toIndex - reconciler.model.anchorIndex);

      for (let i = 0; i < stepsToPop; i++) {
        const activeBefore = activeActivityOf(actions.getStack());

        if (!activeBefore) {
          return false;
        }

        const liveStepCountBefore = liveStepsOf(activeBefore).length;

        if (!dispatchChecked(actions, "StepPopped", () => actions.stepPop())) {
          return false;
        }

        const activeAfter = activeActivityOf(actions.getStack());

        if (
          !activeAfter ||
          liveStepsOf(activeAfter).length === liveStepCountBefore
        ) {
          // The core refused the step pop (a recorded no-op — e.g. only one
          // live step left while the entry distance predicted more). Treating
          // it as progress would land the restoration on the wrong step.
          return false;
        }
      }

      if (state.step && isStepEnteredBy(state.step)) {
        actions.dispatchEvent("StepPushed", {
          ...state.step.enteredBy,
        });
      }

      return true;
    };

    /**
     * Forward navigation: re-enter the target entry (and any known
     * intermediate entries skipped over by a multi-entry jump) through the
     * formal action path. Forward entries always reference activities/steps
     * the stack has already popped, so they are re-pushed as fresh events
     * that keep the original `activityId`/`stepId` — entry identity stays
     * stable while the event lands at the end of the log (a re-dispatch of
     * the original event would be deduplicated away).
     */
    const handleForwardNavigation = (
      state: State,
      fromIndex: number,
      toIndex: number,
      actions: StackflowActions,
    ): boolean => {
      for (let index = fromIndex + 1; index <= toIndex; index++) {
        const entryState =
          index === toIndex ? state : reconciler.model.getEntry(index)?.state;

        if (!entryState) {
          // Unknown intermediate entry (previous session) — skip it; its own
          // popstate will restore it if the user ever lands on it.
          continue;
        }

        const active = activeActivityOf(actions.getStack());

        if (!active) {
          return false;
        }

        const entryActivityId = entryState.activity.id;
        const entryStepId = getStateStepId(entryState);

        if (active.id === entryActivityId) {
          if (liveStepsOf(active).some((step) => step.id === entryStepId)) {
            continue;
          }

          const stepParams =
            entryState.step?.params ?? entryState.activity.params;

          if (
            !dispatchChecked(actions, "StepPushed", () =>
              actions.stepPush({
                stepId: entryStepId,
                stepParams,
              }),
            )
          ) {
            return false;
          }

          continue;
        }

        if (
          !dispatchChecked(actions, "Pushed", () =>
            actions.push({
              activityId: entryActivityId,
              activityName: entryState.activity.name,
              activityParams: entryState.activity.params,
            }),
          )
        ) {
          return false;
        }

        const entryStep = entryState.step;

        if (entryStep) {
          if (
            !dispatchChecked(actions, "StepPushed", () =>
              actions.stepPush({
                stepId: entryStep.id,
                stepParams: entryStep.params,
              }),
            )
          ) {
            return false;
          }
        }
      }

      return true;
    };

    /**
     * Interprets a popstate the reconciler did not cause itself (browser
     * back/forward/go or a restored entry) and translates it into formal
     * navigation actions. The reconciler requests a reconcile pass after this
     * handler returns, no matter what was (or was not) dispatched.
     */
    const handleExternalPopState = (state: State | null) => {
      const actions = coreActions;

      if (!actions) {
        return;
      }

      if (!state) {
        // The cursor left the app's entries (e.g. back past the first app
        // entry, where a real browser would unload the page). There is
        // nothing to navigate to; reconciliation stays suspended until a
        // popstate brings the cursor back onto an app entry.
        reconciler.model.markOutOfApp();
        return;
      }

      const model = reconciler.model;
      const fromIndex = model.currentIndex;
      const toIndex = resolveEntryIndex(state, fromIndex, actions);

      model.learnEntry(toIndex, {
        identity: identityOfState(state),
        state,
      });
      model.moveCursor(toIndex);

      if (toIndex === fromIndex) {
        // Rapid successive navigations can coalesce: the browser reports the
        // same final entry more than once. The first event already
        // dispatched the navigation.
        return;
      }

      const completed =
        toIndex < fromIndex
          ? handleBackwardNavigation(state, toIndex, actions)
          : handleForwardNavigation(state, fromIndex, toIndex, actions);

      if (completed && toIndex < fromIndex) {
        // The desired entries now end at the landed entry; re-derive the
        // anchor so that entries restored from previous sessions extend the
        // coordinate system downwards.
        model.setAnchorIndex(toIndex - (computeDesired().length - 1));
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

        /**
         * Kick off the `defaultHistory` setup navigation in a post-commit
         * effect instead of synchronously in `onInit`. This keeps the first
         * client render identical to the server-rendered output (frame 0),
         * eliminating the hydration mismatch, while the staged "stacking" setup
         * animation still plays — just after the first paint. (`coreActions` is
         * captured in `onInit`, which always runs before this effect.)
         */
        useEffect(() => {
          if (hasDispatchedInitialSetupNavigation || !coreActions) {
            return;
          }

          hasDispatchedInitialSetupNavigation = true;
          dispatchInitialSetupNavigation(coreActions);
        }, []);

        /**
         * Ties the reconciler's history listener to the `<Stack />`
         * lifecycle so unmounting the app stops it from interpreting
         * popstates (and fixes the listener leak of previous versions).
         */
        useEffect(() => {
          reconciler.retain();

          return () => {
            reconciler.release();
          };
        }, []);

        return (
          <HistoryQueueProvider
            requestHistoryTick={reconciler.requestHistoryTick}
          >
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
        const matchedActivityRoute = activityRoutes.find((activityRoute) => {
          const template = makeTemplate(
            activityRoute,
            options.urlPatternOptions,
          );
          const activityParams = template.parse(currentPath);

          return activityParams !== null;
        });
        const targetActivityRoute = (() => {
          if (matchedActivityRoute) {
            return matchedActivityRoute;
          }
          const fallbackActivityName = options.fallbackActivity({
            initialContext,
          });
          return activityRoutes.find(
            (activityRoute) =>
              activityRoute.activityName === fallbackActivityName,
          )!;
        })();
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
      onInit({ actions }) {
        // Capture core actions for the post-commit `wrapStack` effect that
        // kicks off the staged `defaultHistory` setup (see `coreActions`) and
        // for the popstate navigation handlers above.
        coreActions = actions;

        const initialState = parseState(history.location.state);

        if (initialState === null) {
          reconciler.initializeFreshBoot(computeDesired());
        } else {
          reconciler.initializeRestored(initialState, computeDesired());
        }

        reconciler.start();
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
      onBeforeReplace({ actionParams, actions: { overrideActionParams } }) {
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
      onChanged({ actions }) {
        dispatchInitialSetupNavigation(actions);
        reconciler.requestReconcile();
      },
    };
  };
}
