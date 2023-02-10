import type { Activity, DomainEvent } from "..";

type Reducer<T> = (state: T, event: DomainEvent) => T;

export function createReducer<T>(reducerMap: {
  [key in DomainEvent["name"]]: (
    state: T,
    event: Extract<DomainEvent, { name: key }>,
  ) => T;
}) {
  return (activity: T, event: DomainEvent) => {
    const reducer = reducerMap[event.name] as Reducer<T>;
    if (reducer) {
      return reducer(activity, event);
    }
    throw new Error(`No reducer for event ${JSON.stringify(event)}`);
  };
}
