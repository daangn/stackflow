/**
 * The four permanent-desync problems FEP-2001 resolves, each reproduced as an
 * observable behavior with both plugins applied. On the unfixed product these
 * assert red (the desync is real); they turn green once the product upholds
 * browser == stack across preventDefault.
 *
 * Witnesses are external only: SCREEN / URL / STACK, the per-blocker dialog,
 * and navigability (where back/forward reach). Internal coordinates are never
 * read.
 */

import { setupHarness } from "../dal/fixture";

const open = setupHarness();

type H = Awaited<ReturnType<typeof open>>;

async function expectAt(h: H, name: string, path: string): Promise<void> {
  expect(await h.readActiveScreen()).toBe(name);
  expect((await h.readStack()).active?.name).toBe(name);
  expect(await h.readPath()).toBe(path);
}

describe("problem 1 — a blocked browser back keeps the user in place", () => {
  test("an armed blocker stops a browser back and the URL is restored", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.browserBack();
    await h.settle();
    // The pop is vetoed: the screen and URL stay at the current entry.
    await expectAt(h, "Article", "/articles/1/");
    expect(await h.hasDialog("b1")).toBe(true);
    // The history entry survives: a second back is vetoed again.
    await h.browserBack();
    await h.settle();
    await expectAt(h, "Article", "/articles/1/");
  });

  test("proceeding the blocked browser back completes the pop", async () => {
    // On the unfixed product the browser back is never vetoed, so no dialog
    // appears and `waitForDialog` times out — that timeout is the red. On the
    // fixed product the dialog appears, the proceed commits, and this is a fast
    // green.
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.browserBack();
    await h.waitForDialog("b1");
    await h.confirm("b1");
    await h.settle();
    await expectAt(h, "Home", "/");
  });

  test("with no blocker, browser back still pops (regression guard)", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.browserBack();
    await h.settle();
    await expectAt(h, "Home", "/");
  });
});

describe("problem 2 — a blocked programmatic navigation does not desync", () => {
  test("a blocked pop leaves URL and stack at the current entry", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.settle();
    await expectAt(h, "Article", "/articles/1/");
    // No phantom forward entry was created.
    await h.browserForward();
    await h.settle();
    await expectAt(h, "Article", "/articles/1/");
    // The back entry is intact: dismiss the dialog, disarm, and browser back
    // must still reach Home. Catches an implementation that restored the
    // visible position but lost or rewrote the real back entry.
    await h.cancelBlock("b1");
    await h.toggleArm("b1");
    await h.browserBack();
    await h.settle();
    await expectAt(h, "Home", "/");
  });

  test("a blocked stepPop leaves URL and stack at the current step", async () => {
    const h = await open({ block: "Article:StepPopped" });
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.attemptStepPop();
    await h.waitForDialog("b1");
    await h.settle();
    expect((await h.readStack()).active?.stepCount).toBe(2);
    await expectAt(h, "Article", "/articles/2/");
  });

  test("a blocked replace of a stepful activity does not desync", async () => {
    // A single-step replace queues no history side effect; the desync this
    // problem describes appears when the replaced activity owns step entries.
    const h = await open({ block: "Article:Replaced" });
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.attemptReplaceThird("9");
    await h.waitForDialog("b1");
    await h.settle();
    await expectAt(h, "Article", "/articles/2/");
  });

  test("proceeding a blocked pop completes it consistently", async () => {
    // On the unfixed product the blocked pop already moved the browser (the
    // queued history.back ran), and the proceed runs a second back that
    // underflows the app history — the bridge reports "navigated away" and that
    // is the red. On the fixed product no spurious back occurs, the proceed
    // commits cleanly, and this is a fast green.
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.confirm("b1");
    await h.settle();
    await expectAt(h, "Home", "/");
  });
});

describe("problem 3 — a blocked browser forward does not desync or leak", () => {
  test("a blocked browser-forward push restores to the current entry", async () => {
    const h = await open({ block: "Home:Pushed" });
    await h.toggleArm("b1"); // allow the setup push
    await h.pushArticle("1");
    await h.browserBack();
    await h.settle();
    await expectAt(h, "Home", "/");
    await h.toggleArm("b1"); // re-arm; the forward push must be vetoable
    await h.browserForward();
    await h.settle();
    await expectAt(h, "Home", "/");
    expect(await h.hasDialog("b1")).toBe(true);
  });

  test("a normal push after a blocked forward syncs exactly (no counter leak)", async () => {
    const h = await open({ block: "Home:Pushed" });
    await h.toggleArm("b1");
    await h.pushArticle("1");
    await h.browserBack();
    await h.settle();
    await h.toggleArm("b1");
    await h.browserForward();
    await h.settle();
    // Cancel the veto dialog, then make a fresh push that must sync exactly.
    await h.cancelBlock("b1");
    await h.toggleArm("b1");
    await h.pushArticle("2");
    await expectAt(h, "Article", "/articles/2/");
  });

  test("a normal stepPush after a blocked step-forward syncs exactly", async () => {
    const h = await open({ block: "Article:StepPushed" });
    await h.toggleArm("b1");
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.browserBack();
    await h.settle();
    expect((await h.readStack()).active?.params.articleId).toBe("1");
    await h.toggleArm("b1");
    await h.browserForward();
    await h.settle();
    await h.cancelBlock("b1");
    await h.toggleArm("b1");
    await h.stepPushId("3");
    await expectAt(h, "Article", "/articles/3/");
  });
});

describe("problem 4 — hook registration order does not matter", () => {
  // The same blocked browser back and blocked programmatic pop must hold
  // identically whether the blocker is registered before or after history-sync.
  describe.each([
    { order: "blocker-first" as const },
    { order: "blocker-last" as const },
  ])("with $order", ({ order }) => {
    test("a blocked browser back and a blocked pop both keep the user in place", async () => {
      const back = await open({ block: "Article:Popped", order });
      await back.pushArticle("1");
      await back.browserBack();
      await back.settle();
      await expectAt(back, "Article", "/articles/1/");
      expect(await back.hasDialog("b1")).toBe(true);

      const prog = await open({ block: "Article:Popped", order });
      await prog.pushArticle("1");
      await prog.attemptPop();
      await prog.waitForDialog("b1");
      await prog.settle();
      await expectAt(prog, "Article", "/articles/1/");
    });
  });
});
