import type { Activity, Stack, StackflowPlugin } from "@stackflow/core";

export type StackflowReactPlugin<T = never> = () => {
  /**
   * Determine how to render by using the stack state
   */
  render?: (args: {
    stack: Stack & {
      render: (overrideStack?: Partial<Stack>) => {
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
    stack: Stack & {
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
