import type { StackflowReactPlugin } from "@stackflow/react";

import { makeHistorySyncPlugin } from "../common/makeHistorySyncPlugin";
import { HistoryQueueProvider } from "./HistoryQueueContext";
import { RoutesProvider } from "./RoutesContext";

export const historySyncPlugin = makeHistorySyncPlugin<StackflowReactPlugin>(
  ({ activityRoutes, requestHistoryTick }) => ({
    wrapStack({ stack }) {
      return (
        <HistoryQueueProvider requestHistoryTick={requestHistoryTick}>
          <RoutesProvider routes={activityRoutes}>
            {stack.render()}
          </RoutesProvider>
        </HistoryQueueProvider>
      );
    },
  }),
);
