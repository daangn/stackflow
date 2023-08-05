import { id } from "./id";

beforeAll(() => {
  jest.useFakeTimers();
});

const getCalculatedId = (time: number) => (time * 1000).toString(16);

test("id - time() 값을 기반으로 유니크한 아이디 값을 반환한다.", () => {
  const time1 = new Date("2023-08-06").getTime(); // 1691280000000
  const time2 = new Date("2023-08-07").getTime(); // 1691366400000

  jest.setSystemTime(time1);

  expect(id()).toBe(getCalculatedId(time1));
  expect(id()).toBe(getCalculatedId((time1 * 1000 + 1) / 1000));
  expect(id()).toBe(getCalculatedId((time1 * 1000 + 2) / 1000));
  expect(id()).toBe(getCalculatedId((time1 * 1000 + 3) / 1000));

  jest.setSystemTime(time2);

  expect(id()).toBe(getCalculatedId(time2));
  expect(id()).toBe(getCalculatedId((time2 * 1000 + 1) / 1000));
  expect(id()).toBe(getCalculatedId((time2 * 1000 + 2) / 1000));
  expect(id()).toBe(getCalculatedId((time2 * 1000 + 3) / 1000));
});
