import { aggregate, DomainEvent, makeEvent } from "@stackflow/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import isEqual from "react-fast-compare";

import { loop } from "../utils";
import { CoreContext } from "./CoreContext";

export interface CoreProviderProps {
  initialEvents: DomainEvent[];
  children: React.ReactNode;
}
export const CoreProvider: React.FC<CoreProviderProps> = ({
  initialEvents,
  children,
}) => {
  const [events, addEvent] = useReducer(
    (prevEvents: DomainEvent[], e: DomainEvent) => [...prevEvents, e],
    initialEvents,
  );

  const [aggregateOutput, setAggregateOutput] = useState(
    aggregate(events, new Date().getTime()),
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
    (name, parameters) => {
      const event = makeEvent(name, parameters);
      addEvent(event);
      return event;
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
