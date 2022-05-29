import { aggregate, DomainEvent, makeEvent } from "@stackflow/core";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import isEqual from "react-fast-compare";

import { CoreContext } from "./CoreContext";

const INTERVAL_MS = 16;

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
  const [state, setState] = useState(() =>
    aggregate(events, new Date().getTime()),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const t = new Date().getTime();
      const nextState = aggregate(events, t);

      if (!isEqual(state, nextState)) {
        setState(nextState);
      }
      if (nextState.globalTransitionState === "idle") {
        clearInterval(interval);
      }
    }, INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [events, state]);

  return (
    <CoreContext.Provider
      value={useMemo(
        () => ({
          state,
          dispatchEvent(name, parameters) {
            addEvent(makeEvent(name, parameters));
          },
        }),
        [state, addEvent],
      )}
    >
      {children}
    </CoreContext.Provider>
  );
};
