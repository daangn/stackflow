import { StackflowCommonPlugin } from "@stackflow/core";
import React from "react";

export type StackflowReactPlugin = () => {
  renderStack?: (args: {
    stack: {
      activities: Array<{
        key: string;
        render: () => React.ReactNode;
      }>;
    };
  }) => React.ReactElement<any, any> | null;
  wrapStack?: (args: {
    stack: {
      render: () => React.ReactNode;
    };
  }) => React.ReactElement<any, any> | null;
  wrapActivity?: (args: {
    activity: {
      id: string;
      name: string;
      render: () => React.ReactNode;
    };
  }) => React.ReactElement<any, any> | null;
} & ReturnType<StackflowCommonPlugin>;
