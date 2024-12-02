/* @jsxImportSource solid-js */

import type { StackflowSolidPlugin } from "@stackflow/solid";

import { makeHistorySyncPlugin } from "../common/makeHistorySyncPlugin";
import { HistoryQueueProvider } from "./HistoryQueueContext.solid";
import { RoutesProvider } from "./RoutesContext.solid";

export const historySyncPlugin = makeHistorySyncPlugin<StackflowSolidPlugin>(
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
