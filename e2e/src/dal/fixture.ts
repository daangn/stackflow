/**
 * Per-file browser lifecycle for the t1 suites. Call `setupHarness()` inside a
 * describe (or at file top) to get an `open(knobs)` factory; the browser is
 * launched once per file and every opened harness is closed after each test.
 */

import { type Browser, chromium } from "@playwright/test";
import { Harness, type QueryKnobs } from "./harness";

export function setupHarness(): (
  knobs?: QueryKnobs,
  initialPath?: string,
) => Promise<Harness> {
  let browser: Browser;
  let opened: Harness[] = [];

  beforeAll(async () => {
    browser = await chromium.launch({
      channel: process.env.HARNESS_BROWSER_CHANNEL || undefined,
    });
  });

  afterEach(async () => {
    await Promise.all(opened.map((h) => h.close()));
    opened = [];
  });

  afterAll(async () => {
    await browser?.close();
  });

  return async (knobs: QueryKnobs = {}, initialPath = "/") => {
    const harness = await Harness.open(browser, knobs, initialPath);
    opened.push(harness);
    return harness;
  };
}
