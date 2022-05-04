import React from "react";

export type PluginType = {
  render?: (args: {
    activities: Array<{
      id: string;
      render: () => React.ReactNode;
    }>;
  }) => React.ReactNode;
  wrapActivity?: (args: {
    activity: {
      id: string;
      render: () => React.ReactNode;
    };
  }) => React.ReactNode;
  activityWillMount?: () => void;
  activityDidMount?: () => void;
};
