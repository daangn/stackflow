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
    const rawReducer = reducerMap[event.name] as Reducer<T> | undefined;
    if (!rawReducer) {
      throw new Error(`No reducer for event ${JSON.stringify(event)}`);
    }
    return rawReducer.bind(reducerMap)(target, event);
  };
}
