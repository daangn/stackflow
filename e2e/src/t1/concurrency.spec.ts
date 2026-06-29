/**
 * Concurrency, reentrancy and race coverage absent from the original suites.
 * The solution's guarantees (serial sync queue, suppression token, coalescing,
 * idle gating, no race arbitration) are checked as observable behavior: at the
 * settling point the URL matches the committed stack (browser == stack), and
 * double-stable settling rules out a transient mid-glitch. Where a race has no
 * single "winner" the assertion is consistency only, not a specific outcome.
 */

import { setupHarness } from "../dal/fixture";

const open = setupHarness();

type H = Awaited<ReturnType<typeof open>>;

async function expectAt(h: H, name: string, path: string): Promise<void> {
  expect(await h.readActiveScreen()).toBe(name);
  expect((await h.readStack()).active?.name).toBe(name);
  expect(await h.readPath()).toBe(path);
}

describe("concurrency and reentrancy", () => {
  test("several rapid browser-backs settle consistently at the bottom", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.pushArticle("2");
    await h.pushArticle("3");
    await h.rapidBack(3);
    await h.settle();
    await expectAt(h, "Home", "/");
  });

  test("a user back during a lazy push settles consistently", async () => {
    // A base entry below the lazy push so the injected back stays in the app.
    const h = await open({ lazyDelay: 600 });
    await h.pushArticle("1");
    await h.click("push-lazy");
    await h.waitForNonIdle();
    await h.browserBack();
    await h.settle();
    await h.expectBrowserStack();
  });

  test("a user nav during a self-induced multi-step shrink settles consistently", async () => {
    // A base entry below the activity being popped so the injected back stays
    // in the app while the self-induced multi-step shrink is in flight.
    const h = await open();
    await h.pushArticle("0");
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.click("pop");
    await h.rapidBack(1);
    await h.settle();
    await h.expectBrowserStack();
  });

  test("a burst of buffered pushes then a pop coalesces to a consistent point", async () => {
    // The pushes are issued while a lazy push holds the stack paused, so they
    // buffer and commit together on resume — a deterministic way to force
    // several sync reservations to coalesce, without timing-dependent clicks.
    const h = await open({ lazyDelay: 500 });
    await h.click("push-lazy");
    await h.waitForNonIdle();
    await h.fill("param-id", "1");
    await h.click("push-article");
    await h.fill("param-id", "2");
    await h.click("push-article");
    await h.fill("param-id", "3");
    await h.click("push-article");
    await h.click("pop");
    await h.settle();
    await h.expectBrowserStack();
  });

  test("a nested navigation started inside onBlocked settles consistently", async () => {
    const h = await open({ block: "Article:Popped", onBlockedNav: "replace" });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.settle();
    await h.expectBrowserStack();
  });

  test("a blocked browser back discards the forward redo entry consistently", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.toggleArm("b1"); // allow setup navigation
    await h.pushArticle("a");
    await h.pushArticle("b");
    await h.browserBack();
    await h.settle();
    await expectAt(h, "Article", "/articles/a/");
    await h.toggleArm("b1"); // re-arm; the next back must be vetoable
    await h.browserBack();
    await h.settle();
    await expectAt(h, "Article", "/articles/a/");
    // The forward redo entry was discarded by the restore: forward no longer
    // reaches Article(b).
    await h.toggleArm("b1");
    await h.browserForward();
    await h.settle();
    await expectAt(h, "Article", "/articles/a/");
  });

  test("a user back right after a no-op sync pass is not swallowed", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.pushArticle("2");
    // First back reaches Article(1); the browser is already there so the sync
    // pass moves nothing (a no-op pass). Confirm it has settled (double-stable).
    await h.browserBack();
    await h.settle();
    await expectAt(h, "Article", "/articles/1/");
    // The immediately following back must still be processed.
    await h.browserBack();
    await h.settle();
    await expectAt(h, "Home", "/");
  });
});
