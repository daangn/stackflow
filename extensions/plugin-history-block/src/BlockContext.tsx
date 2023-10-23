import type { History, Transition } from "history";
import { createBrowserHistory, createMemoryHistory } from "history";
import {
  createContext,
  createRef,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const BlockContext = createContext<{
  history: History;
}>({
  history:
    typeof window === "undefined"
      ? createMemoryHistory()
      : createBrowserHistory(),
});

export function BlockProvider({
  children,
  history,
}: {
  children: React.ReactNode;
  history: History;
}) {
  const ctx = useMemo(
    () => ({
      history,
    }),
    [history],
  );

  return <BlockContext.Provider value={ctx}>{children}</BlockContext.Provider>;
}

export function useBlockContext(options: {
  onBlocked?: (unblock: () => void, transition: Transition) => void;
}) {
  const { history } = useContext(BlockContext);

  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (blocked) {
      const unblock = () => {
        setBlocked(false);

        return history?.block?.((tx) => {
          options.onBlocked?.(unblock, tx);
        });
      };

      return () => {
        unblock?.();
      };
    }
    return () => {};
  }, [blocked]);

  return {
    blocked,
    setBlocked,
  };
}

const ref = createRef();
