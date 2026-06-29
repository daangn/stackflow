/**
 * Driver Abstraction Layer.
 *
 * Scenarios are written against this small set of primitives — open / click /
 * fill / browserBack / browserForward / waitFor / read* / settle — so they are
 * independent of the driver. Here the primitives are realized on a real
 * Chromium page via the playwright library, but any real-browser automation
 * that implements the same set would run the same scenarios.
 *
 * Settle is observed, never slept for: a step is "done" only once the public
 * transition state is idle and a double-stable check (two snapshots separated
 * by at least one animation frame and one macrotask) agrees.
 */

import type { Browser, BrowserContext, Page } from "@playwright/test";
import {
  type BlockerLogEntry,
  type LocationView,
  type ProbeLogEntry,
  type StackView,
  testid,
} from "../shared/contract";

const BASE_URL = process.env.HARNESS_BASE_URL ?? "http://127.0.0.1:4173";

export type QueryKnobs = Record<string, string | number | boolean | undefined>;

function knobsRecord(knobs: QueryKnobs): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [k, v] of Object.entries(knobs)) {
    if (v !== undefined && v !== false) {
      record[k] = v === true ? "1" : String(v);
    }
  }
  return record;
}

const sel = (tid: string) => `[data-testid="${tid}"]`;

/** The URL this app's route templates produce for a given stack top. */
function expectedPath(active: StackView["active"]): string {
  if (!active) {
    return "/";
  }
  const p = active.stepParams;
  const title = p.title ? `?title=${p.title}` : "";
  switch (active.name) {
    case "Home":
      return "/";
    case "Article":
      return `/articles/${p.articleId}/${title}`;
    case "Third":
      return `/third/${p.thirdId}/`;
    case "Fourth":
      return `/fourth/${p.fourthId}/`;
    case "Lazy":
      return "/lazy/";
    default:
      return "/";
  }
}

export class Harness {
  private constructor(
    readonly page: Page,
    private readonly context: BrowserContext,
  ) {}

  /**
   * Open the harness with the given configuration knobs at the given initial
   * path. Knobs are injected before the app loads (not via the route URL) so
   * navigation assertions observe clean paths.
   */
  static async open(
    browser: Browser,
    knobs: QueryKnobs = {},
    initialPath = "/",
  ): Promise<Harness> {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Cap waits so an unsatisfied positive condition (an expected red on the
    // unfixed product) fails in seconds rather than the 30s default.
    page.setDefaultTimeout(6000);
    const record = knobsRecord(knobs);
    await page.addInitScript((injected) => {
      window.__HARNESS_KNOBS__ = injected;
    }, record);
    await page.goto(`${BASE_URL}${initialPath}`);
    const harness = new Harness(page, context);
    await harness.page.waitForFunction(
      () => window.__harness__?.ready === true,
    );
    await harness.settle();
    return harness;
  }

  async close(): Promise<void> {
    await this.context.close();
  }

  // --- write primitives ---

  async click(tid: string): Promise<void> {
    await this.page.click(sel(tid));
  }

  async fill(tid: string, value: string): Promise<void> {
    await this.page.fill(sel(tid), value);
  }

  async browserBack(): Promise<void> {
    await this.page.goBack();
  }

  async browserForward(): Promise<void> {
    await this.page.goForward();
  }

  // --- blocker interactions ---

  async confirm(blockerId: string): Promise<void> {
    await this.click(testid.blockConfirm(blockerId));
  }

  async cancelBlock(blockerId: string): Promise<void> {
    await this.click(testid.blockCancel(blockerId));
  }

  async toggleMount(blockerId: string): Promise<void> {
    await this.click(testid.blockerMountToggle(blockerId));
  }

  async toggleArm(blockerId: string): Promise<void> {
    await this.click(testid.blockerArmToggle(blockerId));
  }

  hasDialog(blockerId: string): Promise<boolean> {
    return this.isVisible(testid.blockDialog(blockerId));
  }

  /** Names of the actions for which some blocker's onBlocked fired, in order. */
  async blockedActions(): Promise<string[]> {
    const log = await this.readBlockerLog();
    return log.filter((e) => e.phase === "blocked").map((e) => e.action);
  }

  /** "<blockerId>:<action>" for every onBlocked notification, in order. */
  async blockedNotifications(): Promise<string[]> {
    const log = await this.readBlockerLog();
    return log
      .filter((e) => e.phase === "blocked")
      .map((e) => `${e.blockerId}:${e.action}`);
  }

  /** Distinct actions any blocker's shouldBlock was consulted for. */
  async shouldBlockActions(): Promise<string[]> {
    const log = await this.readBlockerLog();
    return [
      ...new Set(
        log.filter((e) => e.phase === "shouldBlock").map((e) => e.action),
      ),
    ];
  }

  // --- read primitives ---

  readStack(): Promise<StackView> {
    return this.page.evaluate(() => {
      const h = window.__harness__;
      if (!h) {
        throw new Error(
          "harness bridge missing: the app navigated away (history desync)",
        );
      }
      return h.getStack();
    });
  }

  readLocation(): Promise<LocationView> {
    return this.page.evaluate(() => {
      const h = window.__harness__;
      if (!h) {
        throw new Error(
          "harness bridge missing: the app navigated away (history desync)",
        );
      }
      return h.getLocation();
    });
  }

  /** pathname + search + hash, mirroring the original suite's path() helper. */
  async readPath(): Promise<string> {
    const loc = await this.readLocation();
    return loc.pathname + loc.search + loc.hash;
  }

  readBlockerLog(): Promise<BlockerLogEntry[]> {
    return this.page.evaluate(() => window.__harness__!.getBlockerLog());
  }

  readProbeLog(): Promise<ProbeLogEntry[]> {
    return this.page.evaluate(() => window.__harness__!.getProbeLog());
  }

  readErrors(): Promise<string[]> {
    return this.page.evaluate(() => window.__harness__!.getErrors());
  }

  readFallbackCount(): Promise<number> {
    return this.page.evaluate(() => window.__harness__!.getFallbackCallCount());
  }

  /** The activity name of the screen the user currently sees, from the DOM. */
  async readActiveScreen(): Promise<string | null> {
    return this.page.evaluate(() => {
      const el = document.querySelector(
        '[data-active="true"][data-testid^="screen-"]',
      );
      return el?.getAttribute("data-testid")?.replace(/^screen-/, "") ?? null;
    });
  }

  // --- visibility / presence ---

  isVisible(tid: string): Promise<boolean> {
    return this.page.isVisible(sel(tid));
  }

  /** Whether the page is still on the harness app (vs left it via back). */
  isOnHarness(): Promise<boolean> {
    return this.page.evaluate(() => Boolean(window.__harness__));
  }

  /**
   * Navigability witness that the current entry is the bottom app entry: a
   * `browserBack()` leaves the app entirely (there is no earlier app entry).
   * Catches a broken implementation that created an extra browser entry where
   * the public stack stayed shallow.
   */
  async expectNoEarlierAppEntry(): Promise<void> {
    await this.browserBack();
    expect(await this.isOnHarness()).toBe(false);
  }

  // --- composite navigation (commit + settle); use raw click for
  //     blocked/race scenarios where the navigation must not settle ---

  async pushArticle(articleId: string, title?: string): Promise<void> {
    await this.fill(testid.paramId, articleId);
    await this.fill(testid.paramTitle, title ?? "");
    await this.click(testid.pushArticle);
    await this.settle();
  }

  async pushThird(thirdId: string): Promise<void> {
    await this.fill(testid.paramId, thirdId);
    await this.click(testid.pushThird);
    await this.settle();
  }

  async pushFourth(fourthId: string): Promise<void> {
    await this.fill(testid.paramId, fourthId);
    await this.click(testid.pushFourth);
    await this.settle();
  }

  async replaceArticle(articleId: string, title?: string): Promise<void> {
    await this.fill(testid.paramId, articleId);
    await this.fill(testid.paramTitle, title ?? "");
    await this.click(testid.replaceArticle);
    await this.settle();
  }

  async replaceThird(thirdId: string): Promise<void> {
    await this.fill(testid.paramId, thirdId);
    await this.click(testid.replaceThird);
    await this.settle();
  }

  async replaceFourth(fourthId: string): Promise<void> {
    await this.fill(testid.paramId, fourthId);
    await this.click(testid.replaceFourth);
    await this.settle();
  }

  async pop(): Promise<void> {
    await this.click(testid.pop);
    await this.settle();
  }

  async stepPushId(id: string): Promise<void> {
    await this.fill(testid.paramId, id);
    await this.click(testid.stepPush);
    await this.settle();
  }

  async stepPop(): Promise<void> {
    await this.click(testid.stepPop);
    await this.settle();
  }

  async stepReplaceId(id: string): Promise<void> {
    await this.fill(testid.paramId, id);
    await this.click(testid.stepReplace);
    await this.settle();
  }

  // --- attempts (click without settling), for navigations that may be
  //     blocked or that must be observed mid-flight ---

  async attemptPushArticle(articleId: string, title?: string): Promise<void> {
    await this.fill(testid.paramId, articleId);
    await this.fill(testid.paramTitle, title ?? "");
    await this.click(testid.pushArticle);
  }

  async attemptReplaceThird(thirdId: string): Promise<void> {
    await this.fill(testid.paramId, thirdId);
    await this.click(testid.replaceThird);
  }

  async attemptPop(): Promise<void> {
    await this.click(testid.pop);
  }

  async attemptStepPush(id: string): Promise<void> {
    await this.fill(testid.paramId, id);
    await this.click(testid.stepPush);
  }

  async attemptStepPop(): Promise<void> {
    await this.click(testid.stepPop);
  }

  async attemptStepReplace(id: string): Promise<void> {
    await this.fill(testid.paramId, id);
    await this.click(testid.stepReplace);
  }

  /** Fire several browser-back presses in one turn (a rapid user burst). */
  async rapidBack(times: number): Promise<void> {
    await this.page.evaluate((n) => {
      for (let i = 0; i < n; i += 1) {
        window.history.back();
      }
    }, times);
  }

  /**
   * browser == stack without pinning a specific resting activity: the URL must
   * be exactly the one this app's public route templates produce for the
   * current stack top (its visible step). Catches a URL that has drifted from
   * the committed stack. Derived from the harness's own route contract, not
   * from history-sync internals.
   */
  async expectBrowserStack(): Promise<void> {
    const stack = await this.readStack();
    const screen = await this.readActiveScreen();
    expect(screen).toBe(stack.active?.name ?? null);
    expect(await this.readPath()).toBe(expectedPath(stack.active));
  }

  /** Real browser Back/Forward then settle. */
  async goBack(): Promise<void> {
    await this.browserBack();
    await this.settle();
  }

  async goForward(): Promise<void> {
    await this.browserForward();
    await this.settle();
  }

  // --- waits (positive-condition polling; timeout = failure) ---

  async waitForActive(name: string): Promise<void> {
    await this.page.waitForFunction(
      (n) => window.__harness__?.getStack().active?.name === n,
      name,
    );
  }

  async waitForPath(path: string): Promise<void> {
    await this.page.waitForFunction((p) => {
      const l = window.__harness__!.getLocation();
      return l.pathname + l.search + l.hash === p;
    }, path);
  }

  async waitForDialog(blockerId: string): Promise<void> {
    await this.page.waitForSelector(sel(testid.blockDialog(blockerId)));
  }

  /** Wait until the stack leaves idle — used to confirm a race window opened. */
  async waitForNonIdle(): Promise<void> {
    await this.page.waitForFunction(
      () => window.__harness__!.getStack().globalTransitionState !== "idle",
    );
  }

  async waitFor(
    predicate: (arg: unknown) => boolean,
    arg?: unknown,
  ): Promise<void> {
    await this.page.waitForFunction(predicate, arg);
  }

  /**
   * Settle to a quiet point: first idle, then double-stable. The two snapshots
   * are separated by ≥1 animation frame + 1 macrotask so a same-frame transient
   * isn't mistaken for stability.
   */
  async settle(timeoutMs = 8000): Promise<void> {
    await this.page.evaluate(async (timeout) => {
      const h = window.__harness__;
      if (!h) {
        throw new Error(
          "harness bridge missing: the app navigated away (history desync)",
        );
      }
      const snapshot = () => {
        const stack = h.getStack();
        const loc = h.getLocation();
        return JSON.stringify({
          global: stack.globalTransitionState,
          name: stack.active?.name ?? null,
          params: stack.active?.params ?? null,
          stepCount: stack.active?.stepCount ?? 0,
          transition: stack.active?.transitionState ?? null,
          href: loc.href,
        });
      };
      const tick = () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => setTimeout(resolve, 0)),
        );
      const deadline = Date.now() + timeout;

      while (h.getStack().globalTransitionState !== "idle") {
        if (Date.now() > deadline) {
          throw new Error("settle: stack never reached idle");
        }
        await tick();
      }

      let previous = snapshot();
      for (;;) {
        await tick();
        const current = snapshot();
        if (
          current === previous &&
          h.getStack().globalTransitionState === "idle"
        ) {
          return;
        }
        previous = current;
        if (Date.now() > deadline) {
          throw new Error("settle: stack did not stabilize");
        }
      }
    }, timeoutMs);
  }
}
