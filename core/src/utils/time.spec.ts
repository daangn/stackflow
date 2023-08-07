import { time } from "./time";

beforeAll(() => {
  jest.useFakeTimers();
});

test("time - 동일한 시간에 여러번 호출될 경우 중복을 방지한다.", () => {
  jest.setSystemTime(new Date("2023-08-07T09:00:00Z"));

  const time1 = time();
  const time2 = time();

  expect(time1).not.toBe(time2);
});
