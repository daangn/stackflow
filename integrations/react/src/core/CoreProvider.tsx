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
  useRef,
  useState,
} from "react";

import { makeActivityId } from "../activity";
import { useContext } from "../context";
import { usePlugins } from "../plugins";
import { Activities } from "../stackflow";
import { CoreContext } from "./CoreContext";

type PushedEvent = Extract<DomainEvent, { name: "Pushed" }>;

const SECOND = 1000;
const MINUTE = 60 * SECOND;

// 60fps
const INTERVAL_MS = SECOND / 60;

export interface CoreProviderProps {
  activities: Activities;
  transitionDuration: number;
  initialActivity?: (args: { context: any }) => string;
  children: React.ReactNode;
}
export const CoreProvider: React.FC<CoreProviderProps> = ({
  transitionDuration,
  initialActivity,
  activities,
  children,
}) => {
  const plugins = usePlugins();
  const context = useContext();

  const initialEvents = useMemo(() => {
    const initialEventDate = new Date().getTime() - transitionDuration;

    const initialPushedEventByPlugin = plugins.reduce<PushedEvent | null>(
      (acc, plugin) => plugin.initialPushedEvent?.() ?? acc,
      null,
    );

    const initialPushedEventByOption = initialActivity
      ? makeEvent("Pushed", {
          activityId: makeActivityId(),
          activityName: initialActivity({ context }),
          params: {},
          eventDate: initialEventDate,
        })
      : null;

    const initialPushedEvent =
      initialPushedEventByPlugin ?? initialPushedEventByOption;

    const activityRegisteredEvents = Object.keys(activities).map(
      (activityName) =>
        makeEvent("ActivityRegistered", {
          activityName,
          eventDate: initialEventDate,
        }),
    );

    const events: DomainEvent[] = [
      makeEvent("Initialized", {
        transitionDuration,
        eventDate: initialEventDate,
      }),
      ...activityRegisteredEvents,
    ];

    if (initialPushedEvent) {
      events.push(initialPushedEvent);
    }

    return events;
  }, []);

  const [events, addEvent] = useReducer(
    (prevEvents: DomainEvent[], e: DomainEvent) => [...prevEvents, e],
    initialEvents,
  );

  const [state, setState] = useState(() =>
    aggregate(events, new Date().getTime()),
  );
  const stateRef = useRef(state);
  const getState = useCallback(() => stateRef.current, [stateRef]);

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
        stateRef.current = nextState;
      }

      if (nextState.globalTransitionState === "idle") {
        clearInterval(interval);
      }
    }, INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [events, state, dispatchEvent]);

  return (
    <CoreContext.Provider
      value={useMemo(
        () => ({
          state,
          getState,
          dispatchEvent,
        }),
        [state, getState, dispatchEvent],
      )}
    >
      {children}
    </CoreContext.Provider>
  );
};
