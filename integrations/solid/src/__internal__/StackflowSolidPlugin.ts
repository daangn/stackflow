import type { Activity, Stack, StackflowPlugin } from "@stackflow/core";
import type { Accessor, JSXElement } from "solid-js";

export type StackflowSolidPlugin<T = never> = () => {
  /**
   * Determine how to render by using the stack state
   */
  render?: (args: {
    stack: Stack & {
      render: (overrideStack?: Partial<Stack>) => {
        activities: Accessor<
          Array<
            Activity & {
              render: (overrideActivity?: Partial<Activity>) => JSXElement;
            }
          >
        >;
      };
    };
    initialContext: Accessor<any>;
  }) => JSXElement | null;

  /**
   * Wrap `<Stack />` component with your `Provider` or custom elements
   */
  wrapStack?: (args: {
    stack: Stack & {
      render: () => JSXElement;
    };
    initialContext: Accessor<any>;
  }) => JSXElement | null;

  /**
   * Wrap an activity with your `Provider` or custom elements
   */
  wrapActivity?: (args: {
    activity: Activity & {
      render: () => JSXElement;
    };
    initialContext: Accessor<any>;
  }) => JSXElement | null;
} & ReturnType<StackflowPlugin>;
