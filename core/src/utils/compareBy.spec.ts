import { makeEvent } from "../event-utils";
import { compareBy } from "./compareBy";

test("compareById", () => {
  const firstEvent = makeEvent("Popped", {});
  const secondEvent = makeEvent("Popped", {});

  expect(compareBy(firstEvent, secondEvent, (e) => e.id)).toEqual(-1);
  expect(compareBy(firstEvent, firstEvent, (e) => e.id)).toEqual(0);
  expect(compareBy(secondEvent, firstEvent, (e) => e.id)).toEqual(1);
});
