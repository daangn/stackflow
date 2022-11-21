import type { StackflowActions } from "@stackflow/core";
import { createCoreStore, makeEvent } from "@stackflow/core";
import type {
  PushedEvent,
  StepPushedEvent,
} from "@stackflow/core/dist/event-types";
import React, { useEffect, useMemo } from "react";

import { makeActivityId, makeStepId } from "./activity";
import type { BaseActivities } from "./BaseActivities";
import { CoreProvider } from "./core";
import MainRenderer from "./MainRenderer";
import { PluginsProvider } from "./plugins";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import type { UseActionsOutputType } from "./useActions";
import { useActions } from "./useActions";
import type {
  UseStepActions,
  UseStepActionsOutputType,
} from "./useStepActions";
import { useStepActions } from "./useStepActions";

export type StackComponentType = React.FC<{
  initContext: any;
}>;

type StackflowPluginsEntry<T extends BaseActivities> =
  | StackflowReactPlugin<T>
  | StackflowPluginsEntry<T>[];

function parseActionOptions(options?: { animate?: boolean }) {
  if (!options) {
    return { skipActiveState: false };
  }

  const isNullableAnimateOption =
    options.animate === undefined || options.animate == null;
  if (isNullableAnimateOption) {
    return { skipActiveState: false };
  }

  return { skipActiveState: !options.animate };
}

export type StackflowOptions<T extends BaseActivities> = {
  /**
   * Register activities used in your app
   */
  activities: T;

  /**
   * Transition duration for stack animation (millisecond)
   */
  transitionDuration: number;

  /**
   * Set the first activity to load at the bottom
   * (It can be overwritten by plugin)
   */
  initialActivity?: () => Extract<keyof T, string>;

  /**
   * Inject stackflow plugins
   */
  plugins?: Array<StackflowPluginsEntry<T>>;
};

export type StackflowOutput<T extends BaseActivities> = {
  /**
   * Created `<Stack />` component
   */
  Stack: StackComponentType;

  /**
   * Created `useFlow()` hooks
   */
  useFlow: () => UseActionsOutputType<T>;

  /**
   * Created `useStepFlow()` hooks
   */
  useStepFlow: UseStepActions<T>;

  /**
   * Created action triggers
   */
  actions: Pick<StackflowActions, "dispatchEvent" | "getStack"> &
    Pick<UseActionsOutputType<T>, "push" | "pop" | "replace"> &
    Pick<UseStepActionsOutputType<{}>, "stepPush" | "stepReplace" | "stepPop">;

  /**
   * Return activities
   */
  activities: T;
};

/**
 * Make `<Stack />` component and `useFlow()` hooks that strictly typed with `activities`
 */
export function stackflow<T extends BaseActivities>(
  options: StackflowOptions<T>,
): StackflowOutput<T> {
  const plugins = (options.plugins ?? [])
    .flat(Infinity as 0)
    .map((p) => p as StackflowReactPlugin<T>);
  const pluginInstances = plugins.map((plugin) => plugin());

  const initialEventDate = new Date().getTime() - options.transitionDuration;

  const initializedEvent = makeEvent("Initialized", {
    transitionDuration: options.transitionDuration,
    eventDate: initialEventDate,
  });

  const activityRegisteredEvents = Object.entries(options.activities).map(
    ([activityName, Activity]) =>
      makeEvent("ActivityRegistered", {
        activityName,
        eventDate: initialEventDate,
        ...("component" in Activity
          ? {
              activityParamsSchema: Activity.paramsSchema,
            }
          : null),
      }),
  );

  const coreStore = createCoreStore({
    initialEvents: [initializedEvent, ...activityRegisteredEvents],
    plugins,
  });
  const { coreActions } = coreStore;

  const activities = Object.entries(options.activities).reduce(
    (acc, [key, Activity]) => {
      if ("component" in Activity) {
        return {
          ...acc,
          [key]: {
            paramsSchema: Activity.paramsSchema,
            component: Activity.component,
          },
        };
      }

      return {
        ...acc,
        [key]: React.memo(Activity),
      };
    },
    {},
  );

  if (typeof window !== "undefined") {
    const html = window.document.documentElement;

    html.style.setProperty(
      "--stackflow-transition-duration",
      `${options.transitionDuration}ms`,
    );
  }

  const actions: StackflowOutput<T>["actions"] = {
    dispatchEvent(name, parameters) {
      return coreActions.dispatchEvent(name, parameters);
    },
    getStack() {
      return coreActions.getStack();
    },
    push(activityName, activityParams, options) {
      const activityId = makeActivityId();

      coreActions.push({
        activityId,
        activityName,
        activityParams,
        skipEnterActiveState: parseActionOptions(options).skipActiveState,
      });

      return {
        activityId,
      };
    },
    replace(activityName, activityParams, options) {
      const activityId = options?.activityId ?? makeActivityId();

      coreActions.replace({
        activityId: options?.activityId ?? makeActivityId(),
        activityName,
        activityParams,
        skipEnterActiveState: parseActionOptions(options).skipActiveState,
      });

      return {
        activityId,
      };
    },
    pop(options) {
      return coreActions.pop({
        skipExitActiveState: parseActionOptions(options).skipActiveState,
      });
    },
    stepPush(params) {
      const stepId = makeStepId();

      return coreActions.stepPush({
        stepId,
        stepParams: params,
      });
    },
    stepReplace(params) {
      const stepId = makeStepId();

      return coreActions.stepReplace({
        stepId,
        stepParams: params,
      });
    },
    stepPop() {
      return coreActions.stepPop({});
    },
  };

  const Stack: StackComponentType = (props) => {
    const initialPushedEventsByOption = useMemo(
      () =>
        options.initialActivity
          ? [
              makeEvent("Pushed", {
                activityId: makeActivityId(),
                activityName: options.initialActivity(),
                activityParams: {},
                eventDate: initialEventDate,
                skipEnterActiveState: false,
              }),
            ]
          : [],
      [],
    );

    const initialPushedEvents = useMemo(
      () =>
        pluginInstances.reduce<(PushedEvent | StepPushedEvent)[]>(
          (initialEvents, pluginInstance) =>
            pluginInstance.overrideInitialEvents?.({
              initialEvents,
              initContext: props.initContext,
            }) ?? initialEvents,
          initialPushedEventsByOption,
        ),
      [],
    );

    useMemo(() => {
      initialPushedEvents.forEach((event) => {
        coreStore.coreActions.dispatchEvent(event.name, event);
      });
    }, []);

    const isInitialActivityIgnored =
      !!initialPushedEvents &&
      !!initialPushedEventsByOption &&
      initialPushedEvents !== initialPushedEventsByOption;

    useEffect(() => {
      if (isInitialActivityIgnored) {
        // eslint-disable-next-line no-console
        console.warn(
          `Stackflow - ` +
            ` Some plugin overrides an "initialActivity" option.` +
            ` The "initialActivity" option you set to "${initialPushedEventsByOption[0].activityName}" in the "stackflow" is ignored.`,
        );
      }

      if (initialPushedEvents.length === 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `Stackflow - ` +
            ` There is no initial activity.` +
            " If you want to set the initial activity," +
            " add the `initialActivity` option of the `stackflow()` function or" +
            " add a plugin that sets the initial activity. (e.g. `@stackflow/plugin-history-sync`)",
        );
      }
    }, []);

    return (
      <PluginsProvider value={pluginInstances}>
        <CoreProvider coreStore={coreStore}>
          <MainRenderer activities={activities} />
        </CoreProvider>
      </PluginsProvider>
    );
  };

  return {
    Stack,
    useFlow: useActions,
    useStepFlow: useStepActions,
    actions,
    activities: options.activities,
  };
}
