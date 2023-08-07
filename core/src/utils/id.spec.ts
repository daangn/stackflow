import { id } from "./id";

beforeAll(() => {
  jest.useFakeTimers();
});

test("id - 시간을 기반으로 유니크한 아이디 값을 반환한다.", () => {
  jest.setSystemTime(new Date("2023-08-07T09:00:00Z"));

  const id1 = id();
  const id2 = id();

  expect(id1).not.toBe(id2);
});
