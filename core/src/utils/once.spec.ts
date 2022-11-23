import { once } from "./once";

test("once - 여러번 호출되도 한번만 실행됩니다", () => {
  const cb = jest.fn();

  const fn = once(cb);

  fn();
  fn();
  fn();
  fn();

  expect(cb).toHaveBeenCalledTimes(1);
});
