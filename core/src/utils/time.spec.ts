import { time } from "./time";

beforeAll(() => {
  jest.useFakeTimers();
});

test("time - 이전 호출과 현재 호출 사이에 시간이 동일한 경우 중복을 방지한다.", () => {
  const time1 = new Date("2023-08-06").getTime(); // 1691280000000
  const time2 = new Date("2023-08-07").getTime(); // 1691366400000

  jest.setSystemTime(time1);

  expect(time()).toBe(time1);
  expect(time()).toBe((time1 * 1000 + 1) / 1000);
  expect(time()).toBe((time1 * 1000 + 2) / 1000);
  expect(time()).toBe((time1 * 1000 + 3) / 1000);

  jest.setSystemTime(time2);

  expect(time()).toBe(time2);
  expect(time()).toBe((time2 * 1000 + 1) / 1000);
  expect(time()).toBe((time2 * 1000 + 2) / 1000);
  expect(time()).toBe((time2 * 1000 + 3) / 1000);
});
