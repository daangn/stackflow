import { createContext, useContext, useMemo } from "react";

type HistoryQueueContextValue = {
  enqueue: (action: () => void) => void;
};

export const HistoryQueueContext = createContext<HistoryQueueContextValue>({
  enqueue: () => {},
});

export const HistoryQueueProvider = ({
  children,
  enqueue,
}: {
  children: React.ReactNode;
} & HistoryQueueContextValue) => {
  const ctx = useMemo(
    () => ({
      enqueue,
    }),
    [enqueue],
  );

  return (
    <HistoryQueueContext.Provider value={ctx}>
      {children}
    </HistoryQueueContext.Provider>
  );
};

export const useHistoryQueue = () => useContext(HistoryQueueContext);
