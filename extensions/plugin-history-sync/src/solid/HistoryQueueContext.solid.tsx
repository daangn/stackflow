/* @jsxImportSource solid-js */

import type { JSXElement } from "solid-js";
import { createContext, useContext } from "solid-js";

import type { RequestHistoryTick } from "../common/makeHistoryTaskQueue";

type HistoryQueueContextValue = {
  requestHistoryTick: RequestHistoryTick;
};

export const HistoryQueueContext = createContext<HistoryQueueContextValue>({
  requestHistoryTick: () => {},
});

export const HistoryQueueProvider = ({
  children,
  requestHistoryTick,
}: {
  children: JSXElement;
} & HistoryQueueContextValue) => (
  <HistoryQueueContext.Provider value={{ requestHistoryTick }}>
    {children}
  </HistoryQueueContext.Provider>
);

export const useHistoryTick = () => useContext(HistoryQueueContext);
