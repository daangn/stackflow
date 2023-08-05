import { id } from "./id";

beforeAll(() => {
  jest.useFakeTimers();
});

const getCalculatedId = (time: number) => (time * 1000).toString(16);

test("id - time() 값을 기반으로 유니크한 아이디 값을 반환한다.", () => {
  const expectedTime1 = new Date("2023-08-06").getTime(); // 1691280000000
  const expectedTime2 = new Date("2023-08-07").getTime(); // 1691366400000

  jest.setSystemTime(expectedTime1);

  expect(id()).toBe(getCalculatedId(expectedTime1));
  expect(id()).toBe(getCalculatedId((expectedTime1 * 1000 + 1) / 1000));
  expect(id()).toBe(getCalculatedId((expectedTime1 * 1000 + 2) / 1000));
  expect(id()).toBe(getCalculatedId((expectedTime1 * 1000 + 3) / 1000));

  jest.setSystemTime(expectedTime2);

  expect(id()).toBe(getCalculatedId(expectedTime2));
  expect(id()).toBe(getCalculatedId((expectedTime2 * 1000 + 1) / 1000));
  expect(id()).toBe(getCalculatedId((expectedTime2 * 1000 + 2) / 1000));
  expect(id()).toBe(getCalculatedId((expectedTime2 * 1000 + 3) / 1000));
});
