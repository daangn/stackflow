import type { DispatchEvent, DomainEvent } from "@stackflow/core";
import { aggregate, makeEvent } from "@stackflow/core";
import type {
  PushedEvent,
  StepPushedEvent,
} from "@stackflow/core/dist/event-types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import isEqual from "react-fast-compare";

import {
  ActivityComponentType,
  makeActivityId,
  parseActivityComponentPropTypes,
} from "../activity";
import type { BaseActivities } from "../BaseActivities";
import { useInitContext } from "../init-context";
import { usePlugins } from "../plugins";
import { CoreActionsContext } from "./CoreActionsContext";
import { CoreStateContext } from "./CoreStateContext";

const SECOND = 1000;

// 60FPS
const INTERVAL_MS = SECOND / 60;

export interface CoreProviderProps {
  activities: BaseActivities;
  transitionDuration: number;
  initialActivity?: (args: { initContext: any }) => string;
  children: React.ReactNode;
}
export const CoreProvider: React.FC<CoreProviderProps> = ({
  transitionDuration,
  initialActivity,
  activities,
  children,
}) => {
  const plugins = usePlugins();
  const initContext = useInitContext();

  const initialEvents = useMemo(() => {
    const initialEventDate = new Date().getTime() - transitionDuration;

    const initialEventsByOption = initialActivity
      ? [
          makeEvent("Pushed", {
            activityId: makeActivityId(),
            activityName: initialActivity({ initContext }),
            activityParams: {},
            eventDate: initialEventDate,
            skipEnterActiveState: false,
          }),
        ]
      : [];

    const initialEventsAfterPlugins = plugins.reduce<
      (PushedEvent | StepPushedEvent)[]
    >(
      (initialEvents, plugin) =>
        plugin.overrideInitialEvents?.({ initialEvents }) ?? initialEvents,
      initialEventsByOption,
    );

    const isInitialActivityIgnored =
      !!initialEventsAfterPlugins &&
      !!initialEventsByOption &&
      initialEventsAfterPlugins !== initialEventsByOption;

    if (isInitialActivityIgnored) {
      // eslint-disable-next-line no-console
      console.warn(
        `Stackflow - ` +
          ` Some plugin overrides an "initialActivity" option.` +
          ` The "initialActivity" option you set to "${initialEventsByOption[0].activityName}" in the "stackflow" is ignored.`,
      );
    }

    const initialEvents = initialEventsAfterPlugins;

    if (initialEvents.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `Stackflow - ` +
          ` There is no initial activity.` +
          " If you want to set the initial activity," +
          " add the `initialActivity` option of the `stackflow()` function or" +
          " add a plugin that sets the initial activity. (e.g. `@stackflow/plugin-history-sync`)",
      );
    }

    const activityRegisteredEvents = Object.entries(activities).map(
      ([activityName, ActivityComponent]) => {
        const activityParamsSchema =
          parseActivityComponentPropTypes(ActivityComponent);

        return makeEvent("ActivityRegistered", {
          activityName,
          eventDate: initialEventDate,
          ...(activityParamsSchema
            ? {
                activityParamsSchema,
              }
            : null),
        });
      },
    );

    const events: DomainEvent[] = [
      makeEvent("Initialized", {
        transitionDuration,
        eventDate: initialEventDate,
      }),
      ...activityRegisteredEvents,
    ];

    initialEvents.forEach((event) => {
      events.push(event);
    });

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
      const events = [...eventsRef.current, makeEvent(name, parameters)];
      const t = new Date().getTime();
      const nextState = aggregate(events, t);

      setState(nextState);

      eventsRef.current = events;
      stateRef.current = nextState;
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
