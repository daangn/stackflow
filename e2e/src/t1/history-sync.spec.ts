/**
 * history-sync navigation behaviors, reproduced in a real browser with both
 * plugins applied and the blocker disarmed (transparent). These are the
 * baseline guarantees: with a transparent blocker present, navigation must
 * behave exactly as history-sync alone. Each step ends with the visible screen,
 * the URL and the public stack agreeing (browser == stack).
 *
 * Sources map to the original historySyncPlugin suite. URLs follow the route
 * templates (trailing slash before the query, as the originals assert); the
 * Home route is "/".
 */

import { setupHarness } from "../dal/fixture";

const open = setupHarness();

async function expectScreen(
  h: Awaited<ReturnType<typeof open>>,
  name: string,
  path: string,
) {
  expect(await h.readActiveScreen()).toBe(name);
  expect(await h.readPath()).toBe(path);
}

describe("history-sync baseline (both plugins applied, blocker disarmed)", () => {
  // --- initial routing ---

  test("an initial URL with no matching route falls back to Home", async () => {
    const h = await open({}, "/non-existent-path");
    await expectScreen(h, "Home", "/");
  });

  test("an initial URL's path and query become the activity params", async () => {
    const h = await open({}, "/articles/123/?title=hello");
    const stack = await h.readStack();
    expect(stack.active?.name).toBe("Article");
    expect(stack.active?.params.articleId).toBe("123");
    expect(stack.active?.params.title).toBe("hello");
    expect(await h.readPath()).toBe("/articles/123/?title=hello");
  });

  test("a matching initial URL does not invoke the fallback", async () => {
    const h = await open({}, "/articles/123");
    expect(await h.readActiveScreen()).toBe("Article");
    expect(await h.readFallbackCount()).toBe(0);
  });

  test("a non-matching initial URL invokes the fallback exactly once", async () => {
    const h = await open({}, "/non-existent-path");
    expect(await h.readFallbackCount()).toBe(1);
  });

  // --- push / replace / useHash ---

  test("pushing an activity updates the URL", async () => {
    const h = await open();
    await h.pushArticle("1234", "hello");
    await expectScreen(h, "Article", "/articles/1234/?title=hello");
  });

  test("with hash routing, pushing updates the hash URL", async () => {
    const h = await open({ hash: true });
    await h.pushArticle("1234", "hello");
    await expectScreen(h, "Article", "/#/articles/1234/?title=hello");
  });

  test("replacing the initial activity updates the URL without growing depth", async () => {
    const h = await open();
    await h.replaceArticle("1234", "hello");
    await expectScreen(h, "Article", "/articles/1234/?title=hello");
    expect((await h.readStack()).activities).toHaveLength(1);
  });

  test("repeated push then pop walks the URL back down", async () => {
    const h = await open();
    await h.pushArticle("1", "hello");
    await expectScreen(h, "Article", "/articles/1/?title=hello");
    await h.pushArticle("2", "hello");
    await expectScreen(h, "Article", "/articles/2/?title=hello");
    await h.pushArticle("3", "hello");
    await expectScreen(h, "Article", "/articles/3/?title=hello");
    await h.pop();
    await expectScreen(h, "Article", "/articles/2/?title=hello");
    await h.pop();
    await expectScreen(h, "Article", "/articles/1/?title=hello");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  // --- browser back / forward ---

  test("browser back after a push returns to Home", async () => {
    const h = await open();
    await h.pushArticle("1234", "hello");
    await h.goBack();
    await expectScreen(h, "Home", "/");
  });

  test("repeated browser back walks the stack down", async () => {
    const h = await open();
    await h.pushArticle("1", "hello");
    await h.pushArticle("2", "hello");
    await h.pushArticle("3", "hello");
    await h.goBack();
    await expectScreen(h, "Article", "/articles/2/?title=hello");
    await h.goBack();
    await expectScreen(h, "Article", "/articles/1/?title=hello");
    await h.goBack();
    await expectScreen(h, "Home", "/");
  });

  test("browser forward re-walks the stack up", async () => {
    const h = await open();
    await h.pushArticle("1", "hello");
    await h.pushArticle("2", "hello");
    await h.pushArticle("3", "hello");
    await h.goBack();
    await h.goBack();
    await h.goBack();
    await expectScreen(h, "Home", "/");
    await h.goForward();
    await expectScreen(h, "Article", "/articles/1/?title=hello");
    await h.goForward();
    await expectScreen(h, "Article", "/articles/2/?title=hello");
    await h.goForward();
    await expectScreen(h, "Article", "/articles/3/?title=hello");
  });

  // --- step navigation + pop removing many entries ---

  test("popping an activity removes all of its step entries at once", async () => {
    const h = await open();
    await h.pushArticle("10", "hello");
    await h.stepPushId("11");
    await expectScreen(h, "Article", "/articles/11/?title=hello");
    await h.stepPushId("12");
    await expectScreen(h, "Article", "/articles/12/?title=hello");
    await h.pushArticle("20", "world");
    await expectScreen(h, "Article", "/articles/20/?title=world");
    await h.pop();
    await expectScreen(h, "Article", "/articles/12/?title=hello");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  test("stepPop past the base step is a no-op", async () => {
    const h = await open();
    await h.pushArticle("10", "hello");
    await h.stepPushId("11");
    await h.stepPushId("12");
    await h.stepPop();
    await expectScreen(h, "Article", "/articles/11/?title=hello");
    await h.stepPop();
    await expectScreen(h, "Article", "/articles/10/?title=hello");
    await h.stepPop();
    await expectScreen(h, "Article", "/articles/10/?title=hello");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  test("stepReplace updates the top step; pop then removes the activity", async () => {
    const h = await open();
    await h.pushArticle("10", "hello");
    await h.stepPushId("11");
    await h.stepReplaceId("12");
    await expectScreen(h, "Article", "/articles/12/?title=hello");
    await h.stepPop();
    await expectScreen(h, "Article", "/articles/10/?title=hello");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  test("browser back/forward walk through step entries, then pop removes the activity", async () => {
    const h = await open();
    await h.pushArticle("10", "hello");
    await h.stepPushId("11");
    await h.stepPushId("12");
    await h.pushArticle("20", "world");

    const articleId = async () =>
      (await h.readStack()).active?.params.articleId;

    await h.goBack();
    expect(await articleId()).toBe("12");
    await h.goBack();
    expect(await articleId()).toBe("11");
    await h.goBack();
    expect(await articleId()).toBe("10");
    await h.goForward();
    expect(await articleId()).toBe("11");
    await h.goForward();
    expect(await articleId()).toBe("12");
    await h.goForward();
    expect(await articleId()).toBe("20");

    await h.pop();
    await expectScreen(h, "Article", "/articles/12/?title=hello");
    await h.stepPop();
    await expectScreen(h, "Article", "/articles/11/?title=hello");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  // --- pointer series: |delta|>1 inductive consistency ---

  test("push, steps, replace, pop points back to the first stack (Home)", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.replaceThird("234");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  test("an extra pushed stack makes the pointer land on the second stack (Article)", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.pushThird("234");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.replaceFourth("567");
    await h.pop();
    await expectScreen(h, "Article", "/articles/1/");
  });

  test("push/steps/push/pop/replace/pop points back to the first stack", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.pushThird("234");
    await h.pop();
    await h.replaceFourth("345");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  test("push/steps/replace/steps/pop points back to the first stack", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.replaceFourth("345");
    await h.stepPushId("5");
    await h.stepPushId("6");
    await h.stepPushId("7");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  test("push/steps/replace/steps/replace/pop points back to the first stack", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.replaceThird("234");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.replaceFourth("345");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  test("push/steps/push/steps/pop/replace/pop points back to the first stack", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.pushThird("234");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.pop();
    await h.replaceFourth("345");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  test("repeating the push/steps/push/steps/pop/replace/pop round still converges to the first stack", async () => {
    const h = await open();
    // round 1
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.pushThird("234");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.pop();
    await h.replaceFourth("345");
    await h.pop();
    // round 2 (different activities)
    await h.pushThird("1");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.pushFourth("234");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.stepPushId("4");
    await h.pop();
    await h.replaceArticle("345");
    await h.pop();
    await expectScreen(h, "Home", "/");
  });

  // --- composite sequences / URL parsing ---

  test("the final pop lands on the lower activity's top step", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.pushArticle("3");
    await h.stepPushId("4");
    await h.stepPushId("5");
    await h.replaceThird("1");
    await h.stepPushId("2");
    await h.pop();
    await expectScreen(h, "Article", "/articles/2/");
  });

  test("replace swaps an activity and its steps without growing depth", async () => {
    const h = await open();
    await h.pushArticle("1");
    await h.stepPushId("2");
    await h.stepPushId("3");
    await h.replaceThird("1");
    await expectScreen(h, "Third", "/third/1/");
  });

  test("search params on a fallback route become activity params", async () => {
    const h = await open({}, "/not/found/route/?foo=1&bar=2");
    const stack = await h.readStack();
    expect(stack.active?.name).toBe("Home");
    expect(stack.active?.params.foo).toBe("1");
    expect(stack.active?.params.bar).toBe("2");
    expect(await h.readPath()).toBe("/?foo=1&bar=2");
  });
});
