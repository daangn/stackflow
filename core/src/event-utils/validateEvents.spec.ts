import { makeEvent } from "./makeEvent";
import { validateEvents } from "./validateEvents";

const initializedEvent = ({
  transitionDuration,
}: {
  transitionDuration: number;
}) => makeEvent("Initialized", { transitionDuration });

const registeredEvent = ({ activityName }: { activityName: string }) =>
  makeEvent("ActivityRegistered", {
    activityName,
  });

test("validateEvents - InitializedEvent가 중복된 경우 throw 합니다", () => {
  expect(() => {
    validateEvents([
      initializedEvent({
        transitionDuration: 300,
      }),
      initializedEvent({
        transitionDuration: 300,
      }),
    ]);
  }).toThrow();
});

test("validateEvents - 빈 배열을 전달하는 경우 throw 합니다", () => {
  expect(() => {
    validateEvents([]);
  }).toThrow();
});

test("validateEvents - 푸시했는데 해당 액티비티가 없는 경우 throw 합니다", () => {
  expect(() => {
    validateEvents([
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "home",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "sample",
        activityParams: {},
      }),
    ]);
  }).toThrow();
});
