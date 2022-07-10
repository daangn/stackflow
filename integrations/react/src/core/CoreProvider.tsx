import {
  aggregate,
  DispatchEvent,
  DomainEvent,
  makeEvent,
} from "@stackflow/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import isEqual from "react-fast-compare";

import { makeActivityId } from "../activity";
import { BaseActivities } from "../BaseActivities";
import { useContext } from "../context";
import { usePlugins } from "../plugins";
import { CoreActionsContext } from "./CoreActionsContext";
import { CoreStateContext } from "./CoreStateContext";

type PushedEvent = Extract<DomainEvent, { name: "Pushed" }>;

const SECOND = 1000;

// 60FPS
const INTERVAL_MS = SECOND / 60;

export interface CoreProviderProps {
  activities: BaseActivities;
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
      ? makeEvent<PushedEvent>("Pushed", {
          activityId: makeActivityId(),
          activityName: initialActivity({ context }),
          params: {},
          eventDate: initialEventDate,
          skipEnterActiveState: true
        })
      : null;

    if (initialPushedEventByPlugin && initialPushedEventByOption) {
      // eslint-disable-next-line no-console
      console.warn(
        `Stackflow - ` +
          ` Some plugin overrides an "initialActivity" option.` +
          ` The "initialActivity" option you set to "${initialPushedEventByOption.activityName}" in the "stackflow" is ignored.`,
      );
    }

    const initialPushedEvent =
      initialPushedEventByPlugin ?? initialPushedEventByOption;

    if (!initialPushedEvent) {
      // eslint-disable-next-line no-console
      console.warn(
        `Stackflow - ` +
          ` There is no initial activity.` +
          " If you want to set the initial activity," +
          " add the `initialActivity` option of the `stackflow()` function or" +
          " add a plugin that sets the initial activity. (e.g. `@stackflow/plugin-history-sync`)",
      );
    }

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

  const initialState = useMemo(
    () => aggregate(initialEvents, new Date().getTime()),
    [],
  );

  const [state, setState] = useState(() => initialState);

  const eventsRef = useRef(initialEvents);
  const stateRef = useRef(initialState);
  const getStack = useCallback(() => stateRef.current, [stateRef]);

  const dispatchEvent = useCallback<DispatchEvent>(
    (name, parameters) => {
      const newEvent = makeEvent(name, parameters);
      const events = [...eventsRef.current, newEvent];
      eventsRef.current = events;

      setState(aggregate(events, new Date().getTime()));
    },
    [eventsRef, setState],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const events = eventsRef.current;
      const nextState = aggregate(events, new Date().getTime());

      if (!isEqual(state, nextState)) {
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
  }, [eventsRef, state, setState]);

  return (
    <CoreStateContext.Provider value={state}>
      <CoreActionsContext.Provider
        value={useMemo(
          () => ({
            getStack,
            dispatchEvent,
          }),
          [getStack, dispatchEvent],
        )}
      >
        {children}
      </CoreActionsContext.Provider>
    </CoreStateContext.Provider>
  );
};
