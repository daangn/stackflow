/**
 * plugin-blocker behaviors, reproduced in a real browser with history-sync
 * applied alongside. The blocker's public contract (which onBlocked fires, in
 * what order, per-blocker dialogs, proceed) is observed via the harness log and
 * the per-blocker dialogs; the coexistence result is the common terminal
 * assertion: at every quiet point SCREEN, URL and STACK agree (browser ==
 * stack). history-sync's internal hooks are never asserted.
 *
 * Sources map to the original blockerPlugin suite sections 1-8. The call-order
 * and error-isolation cases (no real-history timing dimension) live in the
 * jsdom integration tier.
 */

import { setupHarness } from "../dal/fixture";

const open = setupHarness();

type H = Awaited<ReturnType<typeof open>>;

/** browser == stack: the visible screen, the public stack top and the URL agree. */
async function expectAt(h: H, name: string, path: string): Promise<void> {
  expect(await h.readActiveScreen()).toBe(name);
  expect((await h.readStack()).active?.name).toBe(name);
  expect(await h.readPath()).toBe(path);
}

describe("plugin-blocker × history-sync (real browser)", () => {
  // --- basic blocking ---

  test("an armed blocker blocks a programmatic pop", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.settle();
    expect(await h.blockedActions()).toContain("Popped");
    await expectAt(h, "Article", "/articles/1/");
  });

  test("an armed blocker blocks a push", async () => {
    const h = await open({ block: "Home:Pushed" });
    await h.attemptPushArticle("1");
    await h.waitForDialog("b1");
    await h.settle();
    expect(await h.blockedActions()).toContain("Pushed");
    await expectAt(h, "Home", "/");
  });

  test("an armed blocker blocks a replace", async () => {
    const h = await open({ block: "Home:Replaced" });
    await h.attemptReplaceThird("1");
    await h.waitForDialog("b1");
    await h.settle();
    expect(await h.blockedActions()).toContain("Replaced");
    await expectAt(h, "Home", "/");
  });

  test("an armed blocker blocks a stepPush", async () => {
    const h = await open({ block: "Article:StepPushed" });
    await h.pushArticle("1");
    await h.attemptStepPush("2");
    await h.waitForDialog("b1");
    await h.settle();
    expect(await h.blockedActions()).toContain("StepPushed");
    expect((await h.readStack()).active?.stepCount).toBe(1);
    await expectAt(h, "Article", "/articles/1/");
  });

  test("an armed blocker blocks a stepPop", async () => {
    const h = await open({ block: "Article:StepPopped" });
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.attemptStepPop();
    await h.waitForDialog("b1");
    await h.settle();
    expect(await h.blockedActions()).toContain("StepPopped");
    expect((await h.readStack()).active?.stepCount).toBe(2);
    await expectAt(h, "Article", "/articles/2/");
  });

  test("an armed blocker blocks a stepReplace", async () => {
    const h = await open({ block: "Article:StepReplaced" });
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.attemptStepReplace("9");
    await h.waitForDialog("b1");
    await h.settle();
    expect(await h.blockedActions()).toContain("StepReplaced");
    expect((await h.readStack()).active?.params.articleId).toBe("2");
    await expectAt(h, "Article", "/articles/2/");
  });

  // --- basic allowing ---

  test("a disarmed blocker allows navigation", async () => {
    const h = await open();
    await h.pushArticle("1");
    expect(await h.hasDialog("b1")).toBe(false);
    await expectAt(h, "Article", "/articles/1/");
  });

  // --- selective blocking / last committed render ---

  test("a blocker can block Replaced while allowing Pushed", async () => {
    const h = await open({ block: "Home:Replaced" });
    await h.attemptReplaceThird("1");
    await h.waitForDialog("b1");
    await h.settle();
    await expectAt(h, "Home", "/");
    await h.pushArticle("1");
    await expectAt(h, "Article", "/articles/1/");
  });

  test("the last committed render's shouldBlock is the one applied", async () => {
    const h = await open({ block: "Home:Pushed" });
    await h.toggleArm("b1"); // disarm via re-render
    await h.pushArticle("1");
    await expectAt(h, "Article", "/articles/1/");
  });

  // --- activity scope ---

  test("a blocker on a lower activity does not block the active one", async () => {
    const h = await open({ block: "Home:Popped" });
    await h.pushArticle("1");
    await h.pop();
    await expectAt(h, "Home", "/");
  });

  test("a lower activity's blocker reactivates once it becomes active again", async () => {
    const h = await open({ block: "Home:Pushed" });
    await h.toggleArm("b1"); // start disarmed so the first push is allowed
    await h.pushArticle("1");
    await h.toggleArm("b1"); // re-arm while Home is inactive
    await h.pop();
    await expectAt(h, "Home", "/");
    await h.attemptPushArticle("2");
    await h.waitForDialog("b1");
    await h.settle();
    await expectAt(h, "Home", "/");
  });

  test("a replaced activity's blocker leaves no ghost", async () => {
    const h = await open({ block: "Home:Pushed" });
    await h.replaceThird("1");
    await expectAt(h, "Third", "/third/1/");
    await h.pushArticle("1");
    await expectAt(h, "Article", "/articles/1/");
  });

  test("a popped activity's blocker leaves no ghost", async () => {
    const h = await open({ block: "Article:Pushed" });
    await h.pushArticle("1");
    await h.pop();
    await expectAt(h, "Home", "/");
    await h.pushArticle("2");
    await expectAt(h, "Article", "/articles/2/");
  });

  // --- notifications ---

  test("a blocked navigation invokes onBlocked", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.settle();
    expect(await h.blockedNotifications()).toEqual(["b1:Popped"]);
    await expectAt(h, "Article", "/articles/1/");
  });

  test("only the blocking blocker's onBlocked fires", async () => {
    const h = await open({ block: "Article:Popped", blockers: 2 });
    await h.pushArticle("1");
    await h.toggleArm("b2"); // b2 no longer blocks
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.settle();
    expect(await h.hasDialog("b1")).toBe(true);
    expect(await h.hasDialog("b2")).toBe(false);
    expect(await h.blockedNotifications()).toEqual(["b1:Popped"]);
    await expectAt(h, "Article", "/articles/1/");
  });

  test("a non-blocked navigation does not invoke onBlocked", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.stepPushId("2");
    expect(await h.hasDialog("b1")).toBe(false);
    expect((await h.readStack()).active?.stepCount).toBe(2);
    await expectAt(h, "Article", "/articles/2/");
  });

  // --- proceed ---
  // Proceeding a blocked pop is red on the unfixed product: the blocked pop
  // already moved the browser, so the proceed's commit runs a second back that
  // navigates the app away (the bridge reports "navigated away"). On the fixed
  // product the proceed commits cleanly — a fast green.

  test("a single blocker's proceed runs the blocked navigation", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.confirm("b1");
    await h.settle();
    await expectAt(h, "Home", "/");
  });

  test("with two blockers, proceeding one leaves the navigation blocked", async () => {
    const h = await open({ block: "Article:Popped", blockers: 2 });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.waitForDialog("b2");
    await h.confirm("b1");
    await h.settle();
    expect(await h.hasDialog("b2")).toBe(true);
    await expectAt(h, "Article", "/articles/1/");
    await h.confirm("b2");
    await h.settle();
    await expectAt(h, "Home", "/");
  });

  test("with two blockers, proceeding both runs the navigation", async () => {
    const h = await open({ block: "Article:Popped", blockers: 2 });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.waitForDialog("b2");
    await h.confirm("b1");
    await h.confirm("b2");
    await h.settle();
    await expectAt(h, "Home", "/");
  });

  test("proceeding twice runs the navigation only once", async () => {
    const h = await open({ block: "Home:Pushed" });
    await h.attemptPushArticle("1");
    await h.waitForDialog("b1");
    await h.confirm("b1");
    await h.confirm("b1");
    await h.settle();
    await expectAt(h, "Article", "/articles/1/");
    expect((await h.readStack()).activities).toHaveLength(2);
    await h.goBack();
    await expectAt(h, "Home", "/");
  });

  // --- composition (multiple blockers) ---

  test("every blocking blocker is notified", async () => {
    const h = await open({ block: "Article:Popped", blockers: 2 });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.waitForDialog("b2");
    await h.settle();
    expect(await h.blockedNotifications()).toEqual(["b1:Popped", "b2:Popped"]);
    await expectAt(h, "Article", "/articles/1/");
  });

  test("only the blocker that wants to block is notified", async () => {
    const h = await open({ block: "Article:Popped", blockers: 2 });
    await h.pushArticle("1");
    await h.toggleArm("b2");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.settle();
    expect(await h.hasDialog("b2")).toBe(false);
    expect(await h.blockedNotifications()).toEqual(["b1:Popped"]);
    await expectAt(h, "Article", "/articles/1/");
  });

  test("if any blocker blocks, the navigation is blocked", async () => {
    const h = await open({ block: "Article:Popped", blockers: 2 });
    await h.pushArticle("1");
    await h.toggleArm("b2");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.settle();
    await expectAt(h, "Article", "/articles/1/");
  });

  test("if no blocker blocks, the navigation is allowed", async () => {
    const h = await open({ block: "Article:Popped", blockers: 2 });
    await h.pushArticle("1");
    await h.toggleArm("b1");
    await h.toggleArm("b2");
    await h.pop();
    await expectAt(h, "Home", "/");
  });

  // --- lifecycle ---

  test("unmounting a blocker stops it from blocking", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.toggleMount("b1");
    await h.pop();
    await expectAt(h, "Home", "/");
  });

  test("unmounting a blocker stops its onBlocked from firing", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.toggleMount("b1");
    await h.pop();
    expect(await h.hasDialog("b1")).toBe(false);
    await expectAt(h, "Home", "/");
  });

  test("a captured proceed still works after unmount; another blocker keeps it blocked", async () => {
    const h = await open({ block: "Article:Popped", blockers: 2 });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.waitForDialog("b2");
    await h.toggleMount("b2");
    await h.confirm("b2");
    await h.settle();
    await expectAt(h, "Article", "/articles/1/");
  });

  test("a captured proceed still works after unmount; the sole blocker runs it", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.toggleMount("b1");
    await h.confirm("b1");
    await h.settle();
    await expectAt(h, "Home", "/");
  });

  // --- replay interaction with a co-plugin (synthetic probe) ---

  describe.each([
    { placement: "before" as const },
    { placement: "after" as const },
  ])("a co-plugin registered $placement the blocker", ({ placement }) => {
    test("its onBeforePush runs again on replay", async () => {
      const h = await open({
        block: "Home:Pushed",
        probe: placement,
        probeMode: "count",
      });
      await h.attemptPushArticle("1");
      await h.waitForDialog("b1");
      await h.confirm("b1");
      await h.settle();
      const pushHooks = (await h.readProbeLog()).filter(
        (e) => e.hook === "onBeforePush",
      );
      expect(pushHooks).toHaveLength(2);
      await expectAt(h, "Article", "/articles/1/");
    });

    test("a navigation it runs during replay goes through the blocker", async () => {
      const h = await open({
        block: "Home:Pushed",
        probe: placement,
        probeMode: "nested",
      });
      await h.attemptPushArticle("1");
      await h.waitForDialog("b1");
      await h.confirm("b1");
      await h.settle();
      expect(await h.shouldBlockActions()).toContain("Popped");
      // browser == stack regardless of where the nested navigation rests.
      const stack = await h.readStack();
      expect(await h.readActiveScreen()).toBe(stack.active?.name ?? null);
    });

    test("preventDefault during replay cancels the replay", async () => {
      const h = await open({
        block: "Home:Pushed",
        probe: placement,
        probeMode: "prevent",
      });
      await h.attemptPushArticle("1");
      await h.waitForDialog("b1");
      await h.confirm("b1");
      await h.settle();
      await expectAt(h, "Home", "/");
    });
  });
});
