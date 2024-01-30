import { makeEvent } from "../event-utils";
import { divideBy } from "./divideBy";

test("divideBy", () => {
  const firstEvent = makeEvent("Popped", {});
  const secondEvent = makeEvent("StepPopped", {});
  const thirdEvent = makeEvent("StepPopped", {});

  expect(
    divideBy(
      [firstEvent, secondEvent, thirdEvent],
      (e) => e.name === "StepPopped",
    ),
  ).toEqual([[secondEvent, thirdEvent], [firstEvent]]);
});
