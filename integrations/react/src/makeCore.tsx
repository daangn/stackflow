import {
  aggregate,
  AggregateOutput,
  DomainEvent,
  makeEvent,
} from "@stackflow/core";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import isEqual from "react-fast-compare";

import { loop } from "./utils";

const noop = (): any => {};

interface MakeCoreOptions {
  transitionDuration: number;
}
export function makeCore(options: MakeCoreOptions) {
  const initialEvents = [
    makeEvent("Initialized", {
      transitionDuration: options.transitionDuration,
    }),
  ];
  const initialAggregateOutput = aggregate(initialEvents, new Date().getTime());

  const CoreContext = createContext<{
    aggregateOutput: AggregateOutput;
    dispatchEvent: typeof makeEvent;
  }>({
    aggregateOutput: initialAggregateOutput,
    dispatchEvent: noop,
  });

  const CoreProvider: React.FC<{
    children: React.ReactNode;
  }> = ({ children }) => {
    const [events, addEvent] = useReducer(
      (prevEvents: DomainEvent[], e: DomainEvent) => [...prevEvents, e],
      initialEvents,
    );

    const [aggregateOutput, setAggregateOutput] = useState(
      initialAggregateOutput,
    );

    useEffect(() => {
      const { dispose } = loop(() => {
        const nextAggregateOutput = aggregate(events, new Date().getTime());

        if (!isEqual(aggregateOutput, nextAggregateOutput)) {
          setAggregateOutput(nextAggregateOutput);
        }
        if (nextAggregateOutput.globalTransitionState === "idle") {
          dispose();
        }
      });

      return dispose;
    }, [events, aggregateOutput]);

    const dispatchEvent: typeof makeEvent = useCallback(
      (eventName, eventParams) => {
        const e = makeEvent(eventName, eventParams);
        addEvent(e);
        return e;
      },
      [addEvent],
    );

    return (
      <CoreContext.Provider
        value={useMemo(
          () => ({
            aggregateOutput,
            dispatchEvent,
          }),
          [aggregateOutput, dispatchEvent],
        )}
      >
        {children}
      </CoreContext.Provider>
    );
  };

  const useCore = () => useContext(CoreContext);

  return {
    CoreProvider,
    useCore,
  };
}
