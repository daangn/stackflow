import {
  aggregate,
  DispatchEvent,
  DomainEvent,
  makeEvent,
  produceEffects,
} from "@stackflow/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import { CoreContext } from "./CoreContext";
import { CoreLifeCycleHook } from "./CoreLifeCycleHook";

const INTERVAL_MS = 16;

export interface CoreProviderProps {
  initialEvents: DomainEvent[];
  children: React.ReactNode;
  onEffect: CoreLifeCycleHook<any>;
}
export const CoreProvider: React.FC<CoreProviderProps> = ({
  initialEvents,
  children,
  onEffect,
}) => {
  const [events, addEvent] = useReducer(
    (prevEvents: DomainEvent[], e: DomainEvent) => [...prevEvents, e],
    initialEvents,
  );
  const [state, setState] = useState(() =>
    aggregate(events, new Date().getTime()),
  );

  const dispatchEvent = useCallback<DispatchEvent>(
    (name, parameters) => {
      addEvent(makeEvent(name, parameters));
    },
    [addEvent],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const t = new Date().getTime();
      const nextState = aggregate(events, t);

      const effects = produceEffects(state, nextState);

      if (effects.length > 0) {
        setState(nextState);

        effects.forEach((effect) => {
          onEffect({ dispatchEvent }, effect);
        });
      }

      if (nextState.globalTransitionState === "idle") {
        clearInterval(interval);
      }
    }, INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [events, state, onEffect, dispatchEvent]);

  return (
    <CoreContext.Provider
      value={useMemo(
        () => ({
          state,
          dispatchEvent,
        }),
        [state, dispatchEvent],
      )}
    >
      {children}
    </CoreContext.Provider>
  );
};
