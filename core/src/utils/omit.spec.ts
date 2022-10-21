import { omit } from "./omit";

test("omit - 해당 필드를 삭제합니다", () => {
  expect(omit({ hello: "world" }, ["hello"])).toStrictEqual({});
});
