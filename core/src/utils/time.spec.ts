import { time } from "./time";

beforeAll(() => {
  jest.useFakeTimers();
});

test("time - 기본적으로 getTime() 값을 반환하며, 이전 호출과 현재 호출 사이에 시간이 동일한 경우 중복을 방지한다.", () => {
  const expectedTime1 = new Date("2023-08-06").getTime(); // 1691280000000
  const expectedTime2 = new Date("2023-08-07").getTime(); // 1691366400000

  jest.setSystemTime(expectedTime1);

  expect(time()).toBe(expectedTime1);
  expect(time()).toBe((expectedTime1 * 1000 + 1) / 1000);
  expect(time()).toBe((expectedTime1 * 1000 + 2) / 1000);
  expect(time()).toBe((expectedTime1 * 1000 + 3) / 1000);

  jest.setSystemTime(expectedTime2);

  expect(time()).toBe(expectedTime2);
  expect(time()).toBe((expectedTime2 * 1000 + 1) / 1000);
  expect(time()).toBe((expectedTime2 * 1000 + 2) / 1000);
  expect(time()).toBe((expectedTime2 * 1000 + 3) / 1000);
});
