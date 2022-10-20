import { filterEvents } from "./filterEvents";
import { makeEvent } from "./makeEvent";

const initializedEvent = (id: string) =>
  makeEvent("Initialized", {
    transitionDuration: 300,
    id,
  });

const pushedEvent = (id: string) =>
  makeEvent("Pushed", {
    activityId: "1",
    activityName: "2",
    activityParams: {},
    id,
  });

test("filterEvent - 해당하는 이벤트만 존재했을때는 그대로 내려줍니다", () => {
  const e1 = initializedEvent("1");

  const events = filterEvents([e1], "Initialized");

  expect(events).toStrictEqual([e1]);
});

test("filterEvent - 두개의 이벤트 중에 해당하는 이벤트가 있다면 해당 이벤트를 내려줍니다", () => {
  const e1 = initializedEvent("1");
  const e2 = pushedEvent("2");

  const events = filterEvents([e1, e2], "Initialized");

  expect(events).toStrictEqual([e1]);
});

test("filterEvent - 여러개의 이벤트 중에 해당하는 이벤트만 내려줍니다", () => {
  const e1 = initializedEvent("1");
  const e2 = pushedEvent("2");
  const e3 = initializedEvent("3");
  const e4 = pushedEvent("4");
  const e5 = pushedEvent("5");
  const e6 = pushedEvent("6");
  const e7 = initializedEvent("7");

  const events = filterEvents([e1, e2, e3, e4, e5, e6, e7], "Pushed");

  expect(events).toStrictEqual([e2, e4, e5, e6]);
});
