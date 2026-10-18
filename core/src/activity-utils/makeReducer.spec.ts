import type { DomainEvent } from "../event-types";
import { makeReducer } from "./makeReducer";

test("makeReducer - 등록된 이벤트는 해당 reducer로 처리됩니다", () => {
  const reducer = makeReducer<number>({
    Initialized: (state) => state + 1,
    ActivityRegistered: (state) => state,
    Pushed: (state) => state,
    Replaced: (state) => state,
    Popped: (state) => state,
    StepPushed: (state) => state,
    StepReplaced: (state) => state,
    StepPopped: (state) => state,
    Paused: (state) => state,
    Resumed: (state) => state,
  });

  const event = {
    id: "e1",
    name: "Initialized",
    eventDate: 0,
  } as unknown as DomainEvent;

  expect(reducer(0, event)).toBe(1);
});

test("makeReducer - 등록되지 않은 이벤트는 명확한 에러를 던집니다", () => {
  const reducer = makeReducer<number>({
    Initialized: (state) => state,
    ActivityRegistered: (state) => state,
    Pushed: (state) => state,
    Replaced: (state) => state,
    Popped: (state) => state,
    StepPushed: (state) => state,
    StepReplaced: (state) => state,
    StepPopped: (state) => state,
    Paused: (state) => state,
    Resumed: (state) => state,
  });

  const unknownEvent = {
    id: "e1",
    name: "Unknown",
    eventDate: 0,
  } as unknown as DomainEvent;

  expect(() => reducer(0, unknownEvent)).toThrow(
    `No reducer for event ${JSON.stringify(unknownEvent)}`,
  );
});
