import {
  Activity,
  AggregateOutput,
  StackflowCommonPlugin,
} from "@stackflow/core";
import React from "react";

export type StackflowReactPlugin = () => {
  renderStack?: (args: {
    stack: AggregateOutput & {
      activities: Array<
        {
          key: string;
          render: (overrideActivity?: Partial<Activity>) => React.ReactNode;
        } & Activity
      >;
    };
  }) => React.ReactElement<any, any> | null;
  wrapStack?: (args: {
    stack: {
      render: () => React.ReactNode;
    } & AggregateOutput;
  }) => React.ReactElement<any, any> | null;
  wrapActivity?: (args: {
    activity: {
      render: () => React.ReactNode;
    } & Activity;
  }) => React.ReactElement<any, any> | null;
} & ReturnType<StackflowCommonPlugin>;
