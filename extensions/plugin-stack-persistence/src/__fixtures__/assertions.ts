import type { Stack } from "@stackflow/core";
import { expect } from "vitest";

/**
 * The externally meaningful navigation state of a stack: activity
 * composition, order, params, step composition, and which entry is
 * current — the fields a consumer's back navigation depends on. Comparing
 * this view keeps assertions on observable behavior instead of on a
 * serialized golden snapshot.
 */
export function logicalStackView(stack: Stack) {
  return {
    globalTransitionState: stack.globalTransitionState,
    activities: stack.activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      params: activity.params,
      transitionState: activity.transitionState,
      isTop: activity.isTop,
      isActive: activity.isActive,
      steps: activity.steps.map((step) => ({
        id: step.id,
        params: step.params,
      })),
    })),
  };
}

/**
 * Asserts the error object does not carry any of the given references
 * (e.g. the failed record or its snapshot) on its own properties, nor on
 * the own properties of its `cause`. The error contract allows a staged
 * `cause` with the original thrown detail — never the record itself.
 */
export function expectErrorNotToCarry(
  error: unknown,
  bannedReferences: unknown[],
): void {
  expect(error).toBeInstanceOf(Error);

  const carried = (value: unknown) =>
    bannedReferences.filter(
      (banned) => banned !== undefined && banned === value,
    );

  const scan = (owner: object, path: string) => {
    for (const name of Object.getOwnPropertyNames(owner)) {
      const value = (owner as Record<string, unknown>)[name];
      expect
        .soft(
          carried(value),
          `error must not carry the failed record: found a banned reference at ${path}.${name}`,
        )
        .toEqual([]);
    }
  };

  scan(error as object, "error");

  const cause = (error as { cause?: unknown }).cause;
  if (cause !== null && typeof cause === "object") {
    scan(cause, "error.cause");
  }
}

const BANNED_BROWSER_GLOBALS = [
  "window",
  "document",
  "location",
  "localStorage",
  "sessionStorage",
  "indexedDB",
] as const;

export type BrowserGlobalTraps = {
  /** Names that were accessed, even if the resulting throw was swallowed. */
  touched: string[];
  uninstall: () => void;
};

/**
 * Replaces absent browser globals with throwing getters. Direct access
 * throws, and even `typeof window` sniffing evaluates the getter — so any
 * environment probing is both recorded in `touched` and made loud.
 */
export function installBrowserGlobalTraps(): BrowserGlobalTraps {
  const touched: string[] = [];

  for (const name of BANNED_BROWSER_GLOBALS) {
    if (Object.hasOwn(globalThis, name)) {
      throw new Error(
        `expected a browser-less process, but global "${name}" already exists`,
      );
    }

    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        touched.push(name);
        throw new Error(
          `browser global "${name}" was accessed — the persistence contract must not touch the environment`,
        );
      },
    });
  }

  return {
    touched,
    uninstall() {
      for (const name of BANNED_BROWSER_GLOBALS) {
        delete (globalThis as Record<string, unknown>)[name];
      }
    },
  };
}
