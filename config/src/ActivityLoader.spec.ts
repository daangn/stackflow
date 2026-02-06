import type { Activity } from "@stackflow/core";
import { getLoaderFn, getShouldInvalidate } from "./ActivityLoader";

describe("getLoaderFn", () => {
  it("should return undefined when loaderConfig is undefined", () => {
    expect(getLoaderFn(undefined)).toBeUndefined();
  });

  it("should return the function itself when loaderConfig is a function", () => {
    const loaderFn = () => Promise.resolve({ data: "test" });
    expect(getLoaderFn(loaderFn)).toBe(loaderFn);
  });

  it("should return the fn property when loaderConfig is an object", () => {
    const loaderFn = () => Promise.resolve({ data: "test" });
    const loaderConfig = {
      fn: loaderFn,
      shouldInvalidate: () => true,
    };
    expect(getLoaderFn(loaderConfig)).toBe(loaderFn);
  });

  it("should return the fn property when loaderConfig object has no shouldInvalidate", () => {
    const loaderFn = () => Promise.resolve({ data: "test" });
    const loaderConfig = { fn: loaderFn };
    expect(getLoaderFn(loaderConfig)).toBe(loaderFn);
  });
});

describe("getShouldInvalidate", () => {
  it("should return undefined when loaderConfig is undefined", () => {
    expect(getShouldInvalidate(undefined)).toBeUndefined();
  });

  it("should return undefined when loaderConfig is a function", () => {
    const loaderFn = () => Promise.resolve({ data: "test" });
    expect(getShouldInvalidate(loaderFn)).toBeUndefined();
  });

  it("should return the shouldInvalidate function when loaderConfig is an object", () => {
    const shouldInvalidateFn = ({
      prevActivity,
      currentActivity,
    }: {
      prevActivity: Activity;
      currentActivity: Activity;
    }) => !prevActivity.isActive && currentActivity.isActive;

    const loaderConfig = {
      fn: () => Promise.resolve({ data: "test" }),
      shouldInvalidate: shouldInvalidateFn,
    };
    expect(getShouldInvalidate(loaderConfig)).toBe(shouldInvalidateFn);
  });

  it("should return undefined when loaderConfig object has no shouldInvalidate", () => {
    const loaderConfig = {
      fn: () => Promise.resolve({ data: "test" }),
    };
    expect(getShouldInvalidate(loaderConfig)).toBeUndefined();
  });
});
