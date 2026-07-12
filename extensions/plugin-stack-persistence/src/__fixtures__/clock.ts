import type { Stack } from "@stackflow/core";
import { vi } from "vitest";

/**
 * Every deterministic test pins the clock to this instant. Fixture events
 * are dated far enough before it that a freshly created store is already
 * idle, and transitions started "now" settle only when the test advances
 * the fake clock past the transition duration.
 */
export const FIXED_NOW = 1_700_000_100_000;

/** Core recomputes transition state on a ~60fps interval. */
const CORE_TICK_MS = 17;

export function useDeterministicClock(): void {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
}

/** Drains the microtask queue without moving the fake clock. */
export async function settleMicrotasks(rounds = 20): Promise<void> {
  for (let i = 0; i < rounds; i += 1) {
    await Promise.resolve();
  }
}

/**
 * Advances the fake clock tick by tick until the stack reports idle —
 * observing the condition instead of sleeping a guessed amount. Fails
 * loudly when idle is never reached within `maxMs` of fake time.
 */
export async function advanceUntilIdle(
  getStack: () => Stack,
  { maxMs = 10_000 }: { maxMs?: number } = {},
): Promise<void> {
  let elapsed = 0;

  while (getStack().globalTransitionState !== "idle") {
    if (elapsed >= maxMs) {
      throw new Error(
        `expected the stack to reach globalTransitionState "idle" within ${maxMs}ms of fake time, ` +
          `but it is still "${getStack().globalTransitionState}"`,
      );
    }

    await vi.advanceTimersByTimeAsync(CORE_TICK_MS);
    elapsed += CORE_TICK_MS;
  }

  await settleMicrotasks();
}

/**
 * Waits for an observable condition by draining microtasks first, then
 * advancing the fake clock in bounded ticks. Never sleeps wall-clock time
 * and fails with the described expectation when the condition stays false.
 */
export async function waitForCondition(
  condition: () => boolean,
  description: string,
  { maxTicks = 60 }: { maxTicks?: number } = {},
): Promise<void> {
  await settleMicrotasks();

  if (condition()) {
    return;
  }

  for (let i = 0; i < maxTicks; i += 1) {
    await vi.advanceTimersByTimeAsync(CORE_TICK_MS);

    if (condition()) {
      return;
    }
  }

  throw new Error(`condition was never met: ${description}`);
}
