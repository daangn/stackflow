import { createContext, useContext, useMemo } from "react";

export type HistoryQueueContextValue = {
  requestHistoryTick: (action: () => void, listen?: boolean) => void;
};

export const HistoryQueueContext = createContext<HistoryQueueContextValue>({
  requestHistoryTick: () => {},
});

export const HistoryQueueProvider = ({
  children,
  requestHistoryTick,
}: {
  children: React.ReactNode;
} & HistoryQueueContextValue) => {
  const ctx = useMemo(
    () => ({
      requestHistoryTick,
    }),
    [requestHistoryTick],
  );

  return (
    <HistoryQueueContext.Provider value={ctx}>
      {children}
    </HistoryQueueContext.Provider>
  );
};

export const useHistoryTick = () => useContext(HistoryQueueContext);
