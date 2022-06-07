import {
  aggregate,
  AggregateOutput,
  DomainEvent,
  makeEvent,
} from "@stackflow/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import isEqual from "react-fast-compare";

const noop = (): any => {};

function initialAggregateOutput(): AggregateOutput {
  return {
    activities: [],
    globalTransitionState: "idle",
  };
}

const eventsReducer: React.Reducer<DomainEvent[], DomainEvent> = (
  prevState,
  action,
) => [...prevState, action];

export const StackflowCoreContext = React.createContext<{
  aggregateOutput: AggregateOutput;
  dispatchEvent: typeof makeEvent;
}>({
  aggregateOutput: initialAggregateOutput(),
  dispatchEvent: noop,
});

interface StackflowCoreProviderProps {
  transitionDuration: number;
  children: React.ReactNode;
}
export const StackflowCoreProvider: React.FC<StackflowCoreProviderProps> = ({
  transitionDuration,
  children,
}) => {
  const [events, pushEvent] = useReducer(eventsReducer, [
    makeEvent("Initialized", {
      transitionDuration,
    }),
  ]);

  const [aggregateOutput, setAggregateOutput] = useState(
    initialAggregateOutput(),
  );

  useEffect(() => {
    let disposed = false;

    const iter = () => {
      if (disposed) {
        return;
      }

      const nextAggregateOutput = aggregate(events, new Date().getTime());

      if (!isEqual(aggregateOutput, nextAggregateOutput)) {
        setAggregateOutput(nextAggregateOutput);
      }
      if (nextAggregateOutput.globalTransitionState === "idle") {
        return;
      }

      requestAnimationFrame(() => {
        iter();
      });
    };

    iter();

    return () => {
      disposed = true;
    };
  }, [events, aggregateOutput]);

  const dispatchEvent: typeof makeEvent = useCallback(
    (n, params) => {
      const e = makeEvent(n, params);
      pushEvent(e);
      return e;
    },
    [pushEvent],
  );

  return (
    <StackflowCoreContext.Provider
      value={useMemo(
        () => ({
          aggregateOutput,
          dispatchEvent,
        }),
        [aggregateOutput, dispatchEvent],
      )}
    >
      {children}
    </StackflowCoreContext.Provider>
  );
};
