import type {
  Activity,
  AggregateOutput,
  StackflowPlugin,
} from "@stackflow/core";
import type React from "react";

export type StackflowReactPlugin<T = never> = () => {
  /**
   * Determine how to render by using the stack state
   */
  render?: (args: {
    stack: AggregateOutput & {
      render: (overrideStack?: Partial<AggregateOutput>) => {
        activities: Array<
          Activity & {
            key: string;
            render: (overrideActivity?: Partial<Activity>) => React.ReactNode;
          }
        >;
      };
    };
  }) => React.ReactElement<any, any> | null;

  /**
   * Wrap `<Stack />` component with your `Provider` or custom elements
   */
  wrapStack?: (args: {
    stack: AggregateOutput & {
      render: () => React.ReactNode;
    };
  }) => React.ReactElement<any, any> | null;

  /**
   * Wrap an activity with your `Provider` or custom elements
   */
  wrapActivity?: (args: {
    activity: Activity & {
      render: () => React.ReactNode;
    };
  }) => React.ReactElement<any, any> | null;
} & ReturnType<StackflowPlugin>;
