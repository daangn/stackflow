/** @jest-environment jsdom */
import {
  type CoreStore,
  makeCoreStore,
  makeEvent,
  type Stack,
} from "@stackflow/core";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { type ActivityComponentType, stackflow } from "@stackflow/react";
import { act } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { historySyncPlugin } from "./historySyncPlugin";

/**
 * Regression tests for the SSR hydration mismatch that occurred when an
 * activity declared a non-empty `defaultHistory`.
 *
 * The server renders the "frame 0" stack (the first `defaultHistory` entry),
 * because the staged setup navigation is now kicked off from a post-commit
 * effect that never runs during SSR. The client's first render must therefore
 * match that frame, and the staged "stacking" setup animation must still play
 * after hydration.
 */

const TRANSITION_DURATION = 32;

const SSR_INITIAL_CONTEXT = { req: { path: "/articles/1" } };

let eventDateOffset = 0;
const pastEventDate = () => {
  eventDateOffset += 1;
  return new Date(Date.now() - 60 * 1000).getTime() + eventDateOffset;
};

const liveActivityNames = (stack: Stack) =>
  stack.activities
    .filter((activity) => activity.transitionState !== "exit-done")
    .map((activity) => activity.name);

function makeHistorySyncPlugin(options: { withDefaultHistory: boolean }) {
  return historySyncPlugin({
    history: createMemoryHistory({ initialEntries: ["/articles/1"] }),
    routes: {
      Home: "/",
      Article: options.withDefaultHistory
        ? {
            path: "/articles/:articleId",
            defaultHistory: () => [
              { activityName: "Home", activityParams: {} },
            ],
          }
        : "/articles/:articleId",
    },
    fallbackActivity: () => "Home",
  });
}

function buildCoreStore(options: { withDefaultHistory: boolean }): CoreStore {
  return makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: TRANSITION_DURATION,
        eventDate: pastEventDate(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "Home",
        eventDate: pastEventDate(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "Article",
        eventDate: pastEventDate(),
      }),
    ],
    initialContext: SSR_INITIAL_CONTEXT,
    plugins: [makeHistorySyncPlugin(options)],
  });
}

const Home: ActivityComponentType = () => <div data-testid="home">home</div>;
const Article: ActivityComponentType = () => (
  <div data-testid="article">article</div>
);

function makeApp() {
  return stackflow({
    transitionDuration: TRANSITION_DURATION,
    activities: { Home, Article },
    plugins: [
      basicRendererPlugin(),
      makeHistorySyncPlugin({ withDefaultHistory: true }),
    ],
  });
}

describe("historySyncPlugin - SSR hydration with defaultHistory", () => {
  test("store.init() no longer advances a non-empty defaultHistory setup (the server renders frame 0)", () => {
    const coreStore = buildCoreStore({ withDefaultHistory: true });

    // The constructor releases only the first (underlay) entry. The server,
    // which never calls init(), renders exactly this frame.
    expect(liveActivityNames(coreStore.actions.getStack())).toEqual(["Home"]);

    // init() must NOT push the destination anymore — that now happens in a
    // post-commit effect — so the client's first render matches the server.
    coreStore.init();
    expect(liveActivityNames(coreStore.actions.getStack())).toEqual(["Home"]);
  });

  test("an empty defaultHistory still resolves directly to the destination (unchanged)", () => {
    const coreStore = buildCoreStore({ withDefaultHistory: false });

    expect(liveActivityNames(coreStore.actions.getStack())).toEqual([
      "Article",
    ]);
    coreStore.init();
    expect(liveActivityNames(coreStore.actions.getStack())).toEqual([
      "Article",
    ]);
  });

  test("the destination is not rendered during SSR (it is deferred to a post-commit effect)", () => {
    const app = makeApp();

    const html = renderToString(
      <app.Stack initialContext={SSR_INITIAL_CONTEXT} />,
    );

    expect(html).toContain('data-testid="home"');
    expect(html).not.toContain('data-testid="article"');
  });

  test("hydration produces no mismatch and the staged setup animation plays afterwards", async () => {
    jest.useFakeTimers();

    // --- Server render: simulate a non-browser runtime so `store.init()` is
    // skipped, exactly as it is on a real server. The server commits frame 0.
    const serverApp = makeApp();
    const originalWindow = global.window;
    let serverHTML = "";
    try {
      // biome-ignore lint/performance/noDelete: simulate a non-browser runtime
      delete (global as { window?: unknown }).window;
      serverHTML = renderToString(
        <serverApp.Stack initialContext={SSR_INITIAL_CONTEXT} />,
      );
    } finally {
      (global as { window?: unknown }).window = originalWindow;
    }

    expect(serverHTML).toContain('data-testid="home"');
    expect(serverHTML).not.toContain('data-testid="article"');

    // --- Client hydration of that server HTML.
    const container = document.createElement("div");
    container.innerHTML = serverHTML;
    document.body.appendChild(container);

    const recoverableErrors: unknown[] = [];
    const clientApp = makeApp();

    await act(async () => {
      hydrateRoot(
        container,
        <clientApp.Stack initialContext={SSR_INITIAL_CONTEXT} />,
        {
          onRecoverableError: (error: unknown) => {
            recoverableErrors.push(error);
          },
        },
      );
    });

    // The client's first render equalled the server's frame 0 → no mismatch.
    expect(recoverableErrors).toEqual([]);

    // The staged setup navigation ran in the post-commit effect, so the
    // destination mounts after hydration — the stacking animation plays.
    await act(async () => {
      jest.advanceTimersByTime(TRANSITION_DURATION * 2);
    });
    expect(container.querySelector('[data-testid="article"]')).not.toBeNull();

    document.body.removeChild(container);
    jest.useRealTimers();
  });
});
