import {
  aggregate,
  DispatchEvent,
  DomainEvent,
  makeEvent,
  produceEffects,
} from "@stackflow/core";
import { PushedEvent } from "@stackflow/core/dist/event-types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { makeActivityId } from "../activity";
import { usePlugins } from "../plugins";
import { useStackContext } from "../stack-context";
import { Activities } from "../stackflow";
import { StackContext } from "./StackContext";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

// 60fps
const INTERVAL_MS = SECOND / 60;

const INITIAL_EVENT_DATE = new Date().getTime() - MINUTE;

export interface StackProviderProps {
  activities: Activities;
  transitionDuration: number;
  fallbackActivityName?: string;
  children: React.ReactNode;
}
export const StackProvider: React.FC<StackProviderProps> = ({
  fallbackActivityName,
  transitionDuration,
  activities,
  children,
}) => {
  const plugins = usePlugins();
  const stackContext = useStackContext();

  const initialEvents = useMemo(() => {
    const overridenInitialPushedEventByPlugin =
      plugins.reduce<PushedEvent | null>(
        (acc, plugin) =>
          plugin.overrideInitialPushedEvent?.({
            stackContext,
          }) ?? acc,
        null,
      );

    const fallbackInitialPushedEvent = fallbackActivityName
      ? makeEvent("Pushed", {
          activityId: makeActivityId(),
          activityName: fallbackActivityName,
          params: {},
          eventDate: INITIAL_EVENT_DATE,
        })
      : null;

    const initialPushedEvent =
      overridenInitialPushedEventByPlugin ?? fallbackInitialPushedEvent;

    const activityRegisteredEvents = Object.keys(activities).map(
      (activityName) =>
        makeEvent("ActivityRegistered", {
          activityName,
          eventDate: INITIAL_EVENT_DATE,
        }),
    );

    const events: DomainEvent[] = [
      makeEvent("Initialized", {
        transitionDuration,
        eventDate: INITIAL_EVENT_DATE,
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
    <StackContext.Provider
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
    </StackContext.Provider>
  );
};
