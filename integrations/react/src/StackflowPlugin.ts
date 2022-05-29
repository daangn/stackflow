import React from "react";

export interface StackflowPlugin {
  id: string;
  render?: (args: {
    activities: Array<{
      key: string;
      render: () => React.ReactNode;
    }>;
  }) => React.ReactElement<any, any> | null;
}
