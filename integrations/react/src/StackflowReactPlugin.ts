import {
  Activity,
  AggregateOutput,
  StackflowCommonPlugin,
} from "@stackflow/core";
import React from "react";

export type StackflowReactPlugin = () => {
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
