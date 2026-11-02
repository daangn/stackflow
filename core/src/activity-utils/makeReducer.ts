import type { DomainEvent } from "../event-types";

type Reducer<T> = (state: T, event: DomainEvent) => T;

export function makeReducer<T>(
  reducerMap: {
    [key in DomainEvent["name"]]: (
      state: T,
      event: Extract<DomainEvent, { name: key }>,
    ) => T;
  },
) {
  return (target: T, event: DomainEvent) => {
    if (!Object.hasOwn(reducerMap, event.name)) {
      throw new Error(`No reducer for event ${JSON.stringify(event)}`);
    }
    const reducer = (reducerMap[event.name] as Reducer<T>).bind(reducerMap);
    return reducer(target, event);
  };
}
