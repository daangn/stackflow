/** @jest-environment jsdom */
import { defineConfig } from "@stackflow/config";
import type { Stack, StackflowActions } from "@stackflow/core";
import {
  type BlockedNavigation,
  blockerPlugin,
  type NavigationAction,
  useBlocker,
} from "@stackflow/plugin-blocker";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import type { StackflowReactPlugin } from "@stackflow/react";
import { stackflow } from "@stackflow/react";
import { act, cleanup, render } from "@testing-library/react";
import { createBrowserHistory } from "history";
import { historySyncPlugin } from "./historySyncPlugin";

declare module "@stackflow/config" {
  interface Register {
    Home: {};
    Article: {
      articleId: string;
    };
  }
}

type BlockerControls = {
  shouldBlock: (action: NavigationAction) => boolean;
  onBlocked: (
    blockedNavigation: BlockedNavigation,
    actions: { proceed: () => void },
  ) => void;
};

type Harness = Awaited<ReturnType<typeof renderHarness>>;
type FallbackActivity = (args: { initialContext: unknown }) => "Home";

let currentBlocker: BlockerControls | null = null;

function Home() {
  return <div data-testid="activity">home</div>;
}

function Article() {
  useBlocker({
    shouldBlock: (action) => currentBlocker?.shouldBlock(action) ?? false,
    onBlocked: (blockedNavigation, actions) => {
      currentBlocker?.onBlocked(blockedNavigation, actions);
    },
  });

  return <div data-testid="activity">article</div>;
}

function path(browserWindow: Window) {
  return (
    browserWindow.location.pathname +
    browserWindow.location.search +
    browserWindow.location.hash
  );
}

function makeBrowserWindow(initialPath: string): Window {
  const eventTarget = new EventTarget();
  const entries: Array<{ path: string; state: unknown }> = [
    { path: initialPath, state: null },
  ];
  let index = 0;
  const locationState = {
    href: "",
    pathname: "/",
    search: "",
    hash: "",
    assign(url: string | URL) {
      setLocation(String(url));
    },
  } as unknown as Location;

  const setLocation = (url: string | URL) => {
    const nextUrl = new URL(
      String(url || entries[index].path),
      "http://localhost",
    );

    locationState.href = nextUrl.href;
    locationState.pathname = nextUrl.pathname;
    locationState.search = nextUrl.search;
    locationState.hash = nextUrl.hash;
  };

  const dispatchPopState = () => {
    setTimeout(() => {
      eventTarget.dispatchEvent(
        new PopStateEvent("popstate", { state: entries[index].state }),
      );
    }, 0);
  };

  const historyApi = {
    get length() {
      return entries.length;
    },
    get state() {
      return entries[index].state;
    },
    pushState(state: unknown, _: string, url?: string | URL | null) {
      const nextPath = String(url || entries[index].path);

      entries.splice(index + 1);
      entries.push({ path: nextPath, state });
      index = entries.length - 1;
      setLocation(nextPath);
    },
    replaceState(state: unknown, _: string, url?: string | URL | null) {
      const nextPath = String(url || entries[index].path);

      entries[index] = { path: nextPath, state };
      setLocation(nextPath);
    },
    go(delta: number) {
      const nextIndex = index + delta;

      if (nextIndex < 0 || nextIndex >= entries.length || nextIndex === index) {
        return;
      }

      index = nextIndex;
      setLocation(entries[index].path);
      dispatchPopState();
    },
    back() {
      this.go(-1);
    },
    forward() {
      this.go(1);
    },
  } as History;

  setLocation(initialPath);

  return {
    history: historyApi,
    location: locationState,
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
  } as unknown as Window;
}

function activeActivity(stack: Stack) {
  return stack.activities.find((activity) => activity.isActive);
}

function activeSnapshot(getStack: () => Stack) {
  const active = activeActivity(getStack());
  const liveSteps = active?.steps.filter((step) => !step.exitedBy) ?? [];
  const activeStep = liveSteps[liveSteps.length - 1];

  return {
    name: active?.name,
    params: active?.params ?? {},
    stepParams: activeStep?.params ?? {},
    activityCount: getStack().activities.filter(
      (activity) => !activity.exitedBy,
    ).length,
    transition: getStack().globalTransitionState,
  };
}

function serializableSnapshot(harness: {
  baseHistoryLength: number;
  browserWindow: Window;
  getStack: () => Stack;
}) {
  return {
    url: path(harness.browserWindow),
    historyLengthDelta:
      harness.browserWindow.history.length - harness.baseHistoryLength,
    active: activeSnapshot(harness.getStack),
  };
}

async function settleUntilStable(
  harness: {
    baseHistoryLength: number;
    browserWindow: Window;
    getStack: () => Stack;
  },
  selectSnapshot: () => unknown = () => serializableSnapshot(harness),
) {
  let previous = "";
  let stableSamples = 0;

  for (let i = 0; i < 60; i += 1) {
    await act(async () => {
      jest.advanceTimersByTime(17);
      await Promise.resolve();
      await Promise.resolve();
    });

    const next = JSON.stringify(selectSnapshot());
    if (next === previous) {
      stableSamples += 1;
      if (stableSamples >= 2) {
        return;
      }
    } else {
      previous = next;
      stableSamples = 0;
    }
  }

  throw new Error(`historySyncPlugin test harness did not settle: ${previous}`);
}

async function renderHarness({
  initialPath = "/",
  blocker,
  fallbackActivity = () => "Home",
}: {
  initialPath?: string;
  blocker?: BlockerControls;
  fallbackActivity?: FallbackActivity;
} = {}) {
  currentBlocker = blocker ?? null;
  const browserWindow = makeBrowserWindow(initialPath);
  const baseHistoryLength = browserWindow.history.length;
  const history = createBrowserHistory({ window: browserWindow });
  const captured: { actions?: StackflowActions } = {};

  const captureActionsPlugin: StackflowReactPlugin = () => ({
    key: "capture-actions",
    onInit({ actions }) {
      captured.actions = actions;
    },
  });

  const config = defineConfig({
    transitionDuration: 0,
    activities: [
      { name: "Home", route: "/home" },
      { name: "Article", route: "/articles/:articleId" },
    ],
  });

  const { Stack, actions, stepActions } = stackflow({
    config,
    components: {
      Home,
      Article,
    },
    plugins: [
      blockerPlugin(),
      basicRendererPlugin(),
      historySyncPlugin({
        config,
        history,
        fallbackActivity,
      }),
      captureActionsPlugin,
    ],
  });

  const view = render(<Stack />);

  const getStack = () => {
    if (!captured.actions) {
      throw new Error("Stackflow core actions were not captured");
    }

    return captured.actions.getStack();
  };

  const harness = {
    actions,
    stepActions,
    coreActions: captured.actions,
    history,
    baseHistoryLength,
    browserWindow,
    getStack,
    currentPath: () => path(browserWindow),
    snapshot: () =>
      serializableSnapshot({ baseHistoryLength, browserWindow, getStack }),
    settle: (selectSnapshot?: () => unknown) =>
      settleUntilStable(
        { baseHistoryLength, browserWindow, getStack },
        selectSnapshot,
      ),
    view,
  };

  await harness.settle();

  return harness;
}

async function pushArticle(harness: Harness, articleId: string) {
  await act(async () => {
    harness.actions.push("Article", { articleId });
  });
  await harness.settle();
}

async function pushArticleStep(
  harness: Harness,
  params: { articleId: string; tab?: string },
) {
  await act(async () => {
    harness.stepActions.pushStep(params);
  });
  await harness.settle();
}

async function expectLocationAfterBrowserMove(
  harness: Harness,
  move: () => void,
  expected: {
    url: string;
    activeName: string;
    articleId?: string;
    tab?: string;
  },
) {
  await act(async () => {
    move();
  });
  await harness.settle();

  expect(harness.currentPath()).toBe(expected.url);
  expect(activeSnapshot(harness.getStack)).toMatchObject({
    name: expected.activeName,
    params: expected.articleId ? { articleId: expected.articleId } : {},
    stepParams: expected.articleId
      ? {
          articleId: expected.articleId,
          ...(expected.tab ? { tab: expected.tab } : {}),
        }
      : {},
  });
}

describe("historySyncPlugin - deterministic browser harness", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    currentBlocker = null;
  });

  afterEach(() => {
    cleanup();
    currentBlocker = null;
    jest.useRealTimers();
  });

  describe("plugin-blocker interop", () => {
    it.failing(
      "browser back passes through blocker hooks and restores URL/stack when blocked",
      async () => {
        const onBlocked = jest.fn();
        const shouldBlock = jest.fn(
          (action: NavigationAction) => action.name === "Popped",
        );
        const harness = await renderHarness({
          blocker: {
            shouldBlock,
            onBlocked,
          },
        });
        await pushArticle(harness, "1");
        await pushArticle(harness, "2");

        const before = harness.snapshot();
        expect(before).toMatchObject({
          url: "/articles/2/",
          active: {
            name: "Article",
            params: { articleId: "2" },
            activityCount: 3,
          },
        });

        await act(async () => {
          harness.history.back();
        });
        await harness.settle(() => ({
          snapshot: harness.snapshot(),
          shouldBlockCalls: shouldBlock.mock.calls.length,
          onBlockedCalls: onBlocked.mock.calls.length,
        }));

        expect(shouldBlock).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Popped" }),
        );
        expect(onBlocked).toHaveBeenCalledTimes(1);
        expect(harness.snapshot()).toEqual(before);
      },
    );

    it.failing(
      "browser back proceed replays the blocked navigation and syncs browser history",
      async () => {
        let proceed: (() => void) | null = null;
        const harness = await renderHarness({
          blocker: {
            shouldBlock: (action) => action.name === "Popped",
            onBlocked: (_, actions) => {
              proceed = actions.proceed;
            },
          },
        });
        await pushArticle(harness, "1");
        await pushArticle(harness, "2");

        await act(async () => {
          harness.history.back();
        });
        await harness.settle(() => ({
          snapshot: harness.snapshot(),
          hasProceed: proceed !== null,
        }));
        expect(proceed).toEqual(expect.any(Function));

        await act(async () => {
          proceed?.();
        });
        await harness.settle();

        expect(harness.currentPath()).toBe("/articles/1/");
        expect(activeSnapshot(harness.getStack)).toMatchObject({
          name: "Article",
          params: { articleId: "1" },
          stepParams: { articleId: "1" },
        });
      },
    );

    it.failing(
      "rapid browser back attempts while blocked converge without losing the top activity",
      async () => {
        const onBlocked = jest.fn();
        const harness = await renderHarness({
          blocker: {
            shouldBlock: (action) => action.name === "Popped",
            onBlocked,
          },
        });
        await pushArticle(harness, "1");
        await pushArticle(harness, "2");
        await pushArticle(harness, "3");

        const before = harness.snapshot();
        expect(before).toMatchObject({
          url: "/articles/3/",
          active: {
            name: "Article",
            params: { articleId: "3" },
            activityCount: 4,
          },
        });

        await act(async () => {
          harness.history.back();
          harness.history.back();
        });
        await harness.settle(() => ({
          snapshot: harness.snapshot(),
          blockedCount: onBlocked.mock.calls.length,
        }));

        expect(onBlocked).toHaveBeenCalled();
        expect(harness.snapshot()).toEqual(before);
      },
    );

    it.failing(
      "blocked browser step back restores the current step URL and stack",
      async () => {
        const onBlocked = jest.fn();
        const harness = await renderHarness({
          blocker: {
            shouldBlock: (action) => action.name === "StepPopped",
            onBlocked,
          },
        });
        await pushArticle(harness, "1");
        await pushArticleStep(harness, { articleId: "1", tab: "comments" });

        const before = harness.snapshot();

        await act(async () => {
          harness.history.back();
        });
        await harness.settle(() => ({
          snapshot: harness.snapshot(),
          blockedCount: onBlocked.mock.calls.length,
        }));

        expect(onBlocked).toHaveBeenCalledWith(
          expect.objectContaining({
            action: expect.objectContaining({ name: "StepPopped" }),
          }),
          expect.anything(),
        );
        expect(harness.snapshot()).toEqual(before);
      },
    );

    it.failing(
      "blocked programmatic pop/stepPop do not mutate URL or browser entries",
      async () => {
        const onBlocked = jest.fn();
        const harness = await renderHarness({
          blocker: {
            shouldBlock: (action) =>
              action.name === "Popped" || action.name === "StepPopped",
            onBlocked,
          },
        });
        await pushArticle(harness, "1");
        await pushArticleStep(harness, { articleId: "1", tab: "comments" });

        const beforeStepPop = harness.snapshot();

        await act(async () => {
          harness.stepActions.popStep();
        });
        await harness.settle(() => ({
          snapshot: harness.snapshot(),
          blockedCount: onBlocked.mock.calls.length,
        }));

        expect(harness.snapshot()).toEqual(beforeStepPop);

        const beforePop = harness.snapshot();

        await act(async () => {
          harness.actions.pop();
        });
        await harness.settle(() => ({
          snapshot: harness.snapshot(),
          blockedCount: onBlocked.mock.calls.length,
        }));

        expect(harness.snapshot()).toEqual(beforePop);
      },
    );

    it("blocked programmatic push/replace/stepPush/stepReplace leave URL and browser entries unchanged", async () => {
      const onBlocked = jest.fn();
      const harness = await renderHarness({
        blocker: {
          shouldBlock: (action) =>
            action.name === "Pushed" ||
            action.name === "Replaced" ||
            action.name === "StepPushed" ||
            action.name === "StepReplaced",
          onBlocked,
        },
      });
      await pushArticle(harness, "1");

      const beforePush = harness.snapshot();
      await act(async () => {
        harness.actions.push("Home", {});
      });
      await harness.settle(() => ({
        snapshot: harness.snapshot(),
        blockedCount: onBlocked.mock.calls.length,
      }));
      expect(harness.snapshot()).toEqual(beforePush);

      const beforeReplace = harness.snapshot();
      await act(async () => {
        harness.actions.replace("Home", {});
      });
      await harness.settle();
      expect(harness.snapshot()).toEqual(beforeReplace);

      const beforeStepPush = harness.snapshot();
      await act(async () => {
        harness.stepActions.pushStep({ articleId: "1", tab: "blocked" });
      });
      await harness.settle();
      expect(harness.snapshot()).toEqual(beforeStepPush);

      const beforeStepReplace = harness.snapshot();
      await act(async () => {
        harness.stepActions.replaceStep({ articleId: "1", tab: "blocked" });
      });
      await harness.settle();
      expect(harness.snapshot()).toEqual(beforeStepReplace);

      expect(onBlocked).toHaveBeenCalledTimes(4);
    });

    it.failing(
      "programmatic blocked pop completes and syncs history after proceed",
      async () => {
        let proceed: (() => void) | null = null;
        const harness = await renderHarness({
          blocker: {
            shouldBlock: (action) => action.name === "Popped",
            onBlocked: (_, actions) => {
              proceed = actions.proceed;
            },
          },
        });
        await pushArticle(harness, "1");
        await pushArticle(harness, "2");

        await act(async () => {
          harness.actions.pop();
        });
        await harness.settle(() => ({
          snapshot: harness.snapshot(),
          hasProceed: proceed !== null,
        }));
        expect(activeSnapshot(harness.getStack)).toMatchObject({
          name: "Article",
          params: { articleId: "2" },
        });

        await act(async () => {
          proceed?.();
        });
        await harness.settle();

        expect(harness.currentPath()).toBe("/articles/1/");
        expect(activeSnapshot(harness.getStack)).toMatchObject({
          name: "Article",
          params: { articleId: "1" },
        });
      },
    );

    it.failing(
      "navigation started inside a browser-back blocker hook converges URL and stack",
      async () => {
        let actions: Harness["actions"] | null = null;
        const onBlocked = jest.fn(() => {
          actions?.push("Article", { articleId: "3" });
        });
        const harness = await renderHarness({
          blocker: {
            shouldBlock: (action) => action.name === "Popped",
            onBlocked,
          },
        });
        actions = harness.actions;
        await pushArticle(harness, "1");
        await pushArticle(harness, "2");

        await act(async () => {
          harness.history.back();
        });
        await harness.settle(() => ({
          snapshot: harness.snapshot(),
          blockedCount: onBlocked.mock.calls.length,
        }));

        expect(onBlocked).toHaveBeenCalledTimes(1);
        expect(harness.currentPath()).toBe("/articles/3/");
        expect(activeSnapshot(harness.getStack)).toMatchObject({
          name: "Article",
          params: { articleId: "3" },
          stepParams: { articleId: "3" },
        });
      },
    );
  });

  describe("browser history to stackflow state", () => {
    it("back and forward converge active activity and step params", async () => {
      const harness = await renderHarness();
      await pushArticle(harness, "1");
      await pushArticleStep(harness, { articleId: "1", tab: "comments" });
      await pushArticle(harness, "2");

      await expectLocationAfterBrowserMove(
        harness,
        () => harness.history.back(),
        {
          url: "/articles/1/?tab=comments",
          activeName: "Article",
          articleId: "1",
          tab: "comments",
        },
      );
      await expectLocationAfterBrowserMove(
        harness,
        () => harness.history.back(),
        {
          url: "/articles/1/",
          activeName: "Article",
          articleId: "1",
        },
      );
      await expectLocationAfterBrowserMove(
        harness,
        () => harness.history.back(),
        {
          url: "/home/",
          activeName: "Home",
        },
      );
      await expectLocationAfterBrowserMove(
        harness,
        () => harness.history.forward(),
        {
          url: "/articles/1/",
          activeName: "Article",
          articleId: "1",
        },
      );
      await expectLocationAfterBrowserMove(
        harness,
        () => harness.history.forward(),
        {
          url: "/articles/1/?tab=comments",
          activeName: "Article",
          articleId: "1",
          tab: "comments",
        },
      );
      await expectLocationAfterBrowserMove(
        harness,
        () => harness.history.forward(),
        {
          url: "/articles/2/",
          activeName: "Article",
          articleId: "2",
        },
      );
    });

    it.failing("go(n) converges through activity entries", async () => {
      const harness = await renderHarness();
      await pushArticle(harness, "10");
      await pushArticle(harness, "20");
      await pushArticle(harness, "30");

      await expectLocationAfterBrowserMove(
        harness,
        () => harness.history.go(-2),
        {
          url: "/articles/10/",
          activeName: "Article",
          articleId: "10",
        },
      );
      await expectLocationAfterBrowserMove(
        harness,
        () => harness.history.go(2),
        {
          url: "/articles/30/",
          activeName: "Article",
          articleId: "30",
        },
      );
    });

    it("dispatches queued while paused converge URL and stack after resume", async () => {
      const harness = await renderHarness();
      await pushArticle(harness, "1");

      await act(async () => {
        harness.coreActions?.pause();
      });
      await harness.settle();
      expect(harness.snapshot()).toMatchObject({
        url: "/articles/1/",
        active: {
          name: "Article",
          params: { articleId: "1" },
          transition: "paused",
        },
      });

      await act(async () => {
        harness.actions.push("Article", { articleId: "2" });
        harness.stepActions.pushStep({ articleId: "22", tab: "queued" });
      });
      await harness.settle();
      expect(harness.snapshot()).toMatchObject({
        url: "/articles/1/",
        active: {
          name: "Article",
          params: { articleId: "1" },
          transition: "paused",
        },
      });

      await act(async () => {
        harness.coreActions?.resume();
      });
      await harness.settle();

      expect(harness.currentPath()).toBe("/articles/22/?tab=queued");
      expect(activeSnapshot(harness.getStack)).toMatchObject({
        name: "Article",
        params: { articleId: "22" },
        stepParams: { articleId: "22" },
        transition: "idle",
      });
    });

    it("calls fallbackActivity exactly once through the real unmatched initial route path", async () => {
      const fallbackActivity = jest.fn((): "Home" => "Home");

      const harness = await renderHarness({
        initialPath: "/not-found?from=fallback",
        fallbackActivity,
      });

      expect(fallbackActivity).toHaveBeenCalledTimes(1);
      expect(fallbackActivity).toHaveBeenCalledWith({ initialContext: {} });
      expect(harness.currentPath()).toBe("/home/?from=fallback");
      expect(activeSnapshot(harness.getStack)).toMatchObject({
        name: "Home",
        transition: "idle",
      });
    });
  });

  describe("stackflow actions to browser history", () => {
    it("push, replace, and pop update URL and preserve observable browser entries", async () => {
      const harness = await renderHarness();

      await pushArticle(harness, "1");
      expect(harness.snapshot()).toMatchObject({
        url: "/articles/1/",
        historyLengthDelta: 1,
      });

      await act(async () => {
        harness.actions.replace("Article", { articleId: "2" });
      });
      await harness.settle();
      expect(harness.snapshot()).toMatchObject({
        url: "/articles/2/",
        historyLengthDelta: 1,
      });

      await pushArticle(harness, "3");
      expect(harness.snapshot()).toMatchObject({
        url: "/articles/3/",
        historyLengthDelta: 2,
      });

      await act(async () => {
        harness.actions.pop();
      });
      await harness.settle();
      expect(harness.snapshot()).toMatchObject({
        url: "/articles/2/",
        historyLengthDelta: 2,
      });
    });

    it("stepPush, stepReplace, and stepPop update URL while keeping stack state reloadable from history", async () => {
      const harness = await renderHarness();
      await pushArticle(harness, "10");

      await pushArticleStep(harness, { articleId: "11", tab: "comments" });
      expect(harness.snapshot()).toMatchObject({
        url: "/articles/11/?tab=comments",
        historyLengthDelta: 2,
      });

      await act(async () => {
        harness.stepActions.replaceStep({ articleId: "12", tab: "details" });
      });
      await harness.settle();
      expect(harness.snapshot()).toMatchObject({
        url: "/articles/12/?tab=details",
        historyLengthDelta: 2,
      });

      await act(async () => {
        harness.stepActions.popStep();
      });
      await harness.settle();
      expect(harness.snapshot()).toMatchObject({
        url: "/articles/10/",
        historyLengthDelta: 2,
      });

      await expectLocationAfterBrowserMove(
        harness,
        () => harness.history.forward(),
        {
          url: "/articles/12/?tab=details",
          activeName: "Article",
          articleId: "12",
          tab: "details",
        },
      );
    });
  });
});
