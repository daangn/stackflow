import { makeEvent } from "../event-utils";
import { compareEventsById } from "./compareEventsById";

test("compareEventsById", () => {
  const firstEvent = makeEvent("Popped", {});
  const secondEvent = makeEvent("Popped", {});

  expect(compareEventsById(firstEvent, secondEvent)).toEqual(-1);
  expect(compareEventsById(firstEvent, firstEvent)).toEqual(0);
  expect(compareEventsById(secondEvent, firstEvent)).toEqual(1);
});
