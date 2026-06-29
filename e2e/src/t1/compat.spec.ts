/**
 * The preventDefault-consumer coexistence contract, using the blocker's
 * representative model: block now, let the user confirm, then re-issue the same
 * action. At every quiet point browser == stack; on proceed the re-issued
 * action syncs exactly, even across an async confirmation gap and with no
 * leaked counter affecting a subsequent navigation.
 */

import { setupHarness } from "../dal/fixture";

const open = setupHarness();

type H = Awaited<ReturnType<typeof open>>;

async function expectAt(h: H, name: string, path: string): Promise<void> {
  expect(await h.readActiveScreen()).toBe(name);
  expect((await h.readStack()).active?.name).toBe(name);
  expect(await h.readPath()).toBe(path);
}

describe("blocker × history-sync coexistence contract", () => {
  test("blocking a programmatic action keeps screen and URL at the blocked spot", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.settle();
    await expectAt(h, "Article", "/articles/1/");
  });

  test("blocking a browser-initiated action restores to the blocked spot", async () => {
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.browserBack();
    await h.settle();
    await expectAt(h, "Article", "/articles/1/");
    expect(await h.hasDialog("b1")).toBe(true);
  });

  // The proceed cases below are red on the unfixed product because the blocked
  // pop already moved the browser (queued history.back), so a proceed either
  // can't complete the commit (the wait times out) or runs a second back that
  // navigates the app away. On the fixed product they are fast greens.
  test("proceeding across an async gap commits and a later push syncs exactly", async () => {
    const h = await open({ block: "Article:Popped", blockAsync: true });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.confirm("b1");
    // The proceed crosses an async gap; wait for the commit, not a fixed sleep.
    await h.waitForActive("Home");
    await h.settle();
    await expectAt(h, "Home", "/");
    await h.pushArticle("2");
    await expectAt(h, "Article", "/articles/2/");
  });

  test("the block/proceed cycle works regardless of plugin order", async () => {
    const h = await open({ block: "Article:Popped", order: "blocker-first" });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.confirm("b1");
    await h.settle();
    await expectAt(h, "Home", "/");
  });

  test("with two blockers, the action runs only after both proceed", async () => {
    const h = await open({ block: "Article:Popped", blockers: 2 });
    await h.pushArticle("1");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.waitForDialog("b2");
    await h.confirm("b1");
    await h.settle();
    await expectAt(h, "Article", "/articles/1/");
    expect(await h.hasDialog("b2")).toBe(true);
    await h.confirm("b2");
    await h.settle();
    await expectAt(h, "Home", "/");
  });

  test("proceeding twice runs the action once", async () => {
    // Two levels above Home so a second (erroneous) pop would be observable:
    // one pop lands on Article(1); a double execution would reach Home.
    const h = await open({ block: "Article:Popped" });
    await h.pushArticle("1");
    await h.pushArticle("2");
    await h.attemptPop();
    await h.waitForDialog("b1");
    await h.confirm("b1");
    await h.confirm("b1");
    await h.settle();
    // Exactly one pop happened: still at Article(1), not Home.
    await expectAt(h, "Article", "/articles/1/");
    // And it left clean browser entries: disarm and browser back reaches Home
    // once (proving we sit on a single Article(1) entry above Home, not on Home
    // from a duplicated pop).
    await h.toggleArm("b1");
    await h.browserBack();
    await h.settle();
    await expectAt(h, "Home", "/");
  });
});
