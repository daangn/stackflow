import type { StackflowPluginActions } from "@stackflow/core";
import parsePropTypes from "parse-prop-types";
import React, { useMemo } from "react";

import type { BaseActivities } from "./BaseActivities";
import { CoreProvider } from "./core";
import EffectManager from "./EffectManager";
import { InitContextProvider } from "./init-context";
import MainRenderer from "./MainRenderer";
import { PluginsProvider } from "./plugins";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import type { StackRefCurrentType } from "./StackRefManager";
import StackRefManager from "./StackRefManager";
import type { UseActionsOutputType } from "./useActions";
import { useActions } from "./useActions";
import type {
  UseStepActions,
  UseStepActionsOutputType,
} from "./useStepActions";
import { useStepActions } from "./useStepActions";

export interface StackProps {
  /**
   * Context data to pass to plugins in render time
   */
  initContext?: {};
}

export type StackComponentType = React.FC<StackProps>;

type StackflowPluginsEntry<T extends BaseActivities> =
  | StackflowReactPlugin<T>
  | StackflowPluginsEntry<T>[];

export type StackRefType<T extends BaseActivities> =
  React.MutableRefObject<StackRefCurrentType<T> | null>;

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
  initialActivity?: (args: { initContext: any }) => Extract<keyof T, string>;

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
  actions: Pick<StackflowPluginActions, "dispatchEvent" | "getStack"> &
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
  const memoizedActivities = Object.entries(options.activities).reduce(
    (acc, [key, Component]) => ({
      ...acc,
      [key]: React.memo(Component),
    }),
    {},
  );

  if (typeof window !== "undefined") {
    const html = window.document.documentElement;

    html.style.setProperty(
      "--stackflow-transition-duration",
      `${options.transitionDuration}ms`,
    );
  }

  const stackRef: StackRefType<T> = {
    current: null,
  };
  const stackRefNotFoundErrorMessage = (funcName: string) =>
    "`<Stack />` component has not been mounted." +
    " Make sure you include `<Stack />` within your React tree." +
    ` Or, make sure you call \`${funcName}()\` after it is rendered.`;

  const actions: StackflowOutput<T>["actions"] = {
    dispatchEvent(name, parameters) {
      if (!stackRef.current) {
        throw new Error(stackRefNotFoundErrorMessage("dispatchEvent"));
      }

      return stackRef.current.actions.dispatchEvent(name, parameters);
    },
    getStack() {
      if (!stackRef.current) {
        throw new Error(stackRefNotFoundErrorMessage("getStack"));
      }

      return stackRef.current.actions.getStack();
    },
    push(activityName, activityParams, options) {
      if (!stackRef.current) {
        throw new Error(stackRefNotFoundErrorMessage("push"));
      }

      return stackRef.current.actions.push(
        activityName,
        activityParams,
        options,
      );
    },
    pop(options) {
      if (!stackRef.current) {
        throw new Error(stackRefNotFoundErrorMessage("pop"));
      }

      return stackRef.current.actions.pop(options);
    },
    replace(activityName, activityParams, options) {
      if (!stackRef.current) {
        throw new Error(stackRefNotFoundErrorMessage("replace"));
      }

      return stackRef.current.actions.replace(
        activityName,
        activityParams,
        options,
      );
    },
    stepPush(params) {
      if (!stackRef.current) {
        throw new Error(stackRefNotFoundErrorMessage("stepPush"));
      }

      return stackRef.current.actions.stepPush(params);
    },
    stepReplace(params) {
      if (!stackRef.current) {
        throw new Error(stackRefNotFoundErrorMessage("stepReplace"));
      }

      return stackRef.current.actions.stepReplace(params);
    },
    stepPop() {
      if (!stackRef.current) {
        throw new Error(stackRefNotFoundErrorMessage("stepPop"));
      }

      return stackRef.current.actions.stepPop();
    },
  };

  const Stack: StackComponentType = (props) => {
    const plugins = useMemo(
      () =>
        (options.plugins ?? [])
          .flat(Infinity as 0)
          .map((p) => p as StackflowReactPlugin<T>)
          .map((plugin) => plugin({ initContext: props.initContext })),
      [],
    );

    return (
      <InitContextProvider value={props.initContext ?? {}}>
        <PluginsProvider value={plugins}>
          <CoreProvider
            activities={memoizedActivities}
            initialActivity={options.initialActivity}
            transitionDuration={options.transitionDuration}
          >
            <MainRenderer activities={memoizedActivities} />
            <EffectManager />
            <StackRefManager ref={stackRef} />
          </CoreProvider>
        </PluginsProvider>
      </InitContextProvider>
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
