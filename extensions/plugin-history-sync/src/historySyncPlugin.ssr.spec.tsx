/** @jest-environment jsdom */
import { defineConfig } from "@stackflow/config";
import type { Stack } from "@stackflow/core";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow, type StackflowReactPlugin } from "@stackflow/react";
import { act } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { historySyncPlugin } from "./historySyncPlugin";

/**
 * Regression tests for SSR hydration mismatch with non-empty `defaultHistory`.
 *
 * Server HTML and the client's first render must both contain only the initial
 * `defaultHistory` frame, avoiding hydration mismatch. After hydration, the
 * destination activity should still appear.
 */

declare module "@stackflow/config" {
  interface Register {
    Home: {};
    Article: { articleId: string };
  }
}

const TRANSITION_DURATION = 32;

const SSR_INITIAL_CONTEXT = { req: { path: "/articles/1" } };

const liveActivityNames = (stack: Stack) =>
  stack.activities
    .filter((activity) => activity.transitionState !== "exit-done")
    .map((activity) => activity.name);

type DefaultHistoryOption = "non-empty" | "empty" | "none";

function Home() {
  return <div data-testid="home">home</div>;
}
function Article() {
  return <div data-testid="article">article</div>;
}

function stackProbePlugin(onStack: (stack: Stack) => void): StackflowReactPlugin {
  return () => ({
    key: "stack-probe",
    wrapStack({ stack }) {
      onStack(stack);
      return <>{stack.render()}</>;
    },
  });
}

function makeApp({
  defaultHistory = "non-empty",
  extraPlugins = [],
}: {
  defaultHistory?: DefaultHistoryOption;
  extraPlugins?: StackflowReactPlugin[];
} = {}) {
  const articleRoute = (() => {
    switch (defaultHistory) {
      case "non-empty":
        return {
          path: "/articles/:articleId",
          defaultHistory: () => [
            { activityName: "Home" as const, activityParams: {} },
          ],
        };
      case "empty":
        return {
          path: "/articles/:articleId",
          defaultHistory: () => [],
        };
      case "none":
        return "/articles/:articleId";
    }
  })();

  const config = defineConfig({
    transitionDuration: TRANSITION_DURATION,
    activities: [
      { name: "Home", route: "/" },
      {
        name: "Article",
        route: articleRoute,
      },
    ],
  });

  return stackflow({
    config,
    components: { Home, Article },
    plugins: [
      basicRendererPlugin(),
      historySyncPlugin({
        config,
        history: createMemoryHistory({ initialEntries: ["/articles/1"] }),
        fallbackActivity: () => "Home",
      }),
      ...extraPlugins,
    ],
  });
}

function renderServerHTML(app: ReturnType<typeof makeApp>) {
  const originalWindow = global.window;
  try {
    // biome-ignore lint/performance/noDelete: simulate a non-browser runtime
    delete (global as { window?: unknown }).window;
    return renderToString(<app.Stack initialContext={SSR_INITIAL_CONTEXT} />);
  } finally {
    (global as { window?: unknown }).window = originalWindow;
  }
}

describe("historySyncPlugin - SSR hydration with defaultHistory", () => {
  test("a route with no defaultHistory still resolves directly to the destination (unchanged)", () => {
    let capturedStack: Stack | undefined;
    const app = makeApp({
      defaultHistory: "none",
      extraPlugins: [
        stackProbePlugin((stack) => {
          capturedStack = stack;
        }),
      ],
    });
    const html = renderServerHTML(app);

    expect(liveActivityNames(capturedStack!)).toEqual(["Article"]);
    expect(html).toContain('data-testid="article"');
    expect(html).not.toContain('data-testid="home"');
  });

  test("an explicit empty defaultHistory resolves directly to the destination (unchanged)", () => {
    let capturedStack: Stack | undefined;
    const app = makeApp({
      defaultHistory: "empty",
      extraPlugins: [
        stackProbePlugin((stack) => {
          capturedStack = stack;
        }),
      ],
    });
    const html = renderServerHTML(app);

    // `defaultHistory: () => []` and a missing `defaultHistory` both yield no
    // ancestor entries, so the destination lands immediately with no staged
    // setup to defer — there is nothing for the post-commit effect to advance.
    expect(liveActivityNames(capturedStack!)).toEqual(["Article"]);
    expect(html).toContain('data-testid="article"');
    expect(html).not.toContain('data-testid="home"');
  });

  test("the destination is not rendered during SSR", () => {
    const app = makeApp();

    const html = renderServerHTML(app);

    expect(html).toContain('data-testid="home"');
    expect(html).not.toContain('data-testid="article"');
  });

  test("hydration produces no mismatch and the staged setup animation plays afterwards", async () => {
    jest.useFakeTimers();

    // --- Server render: simulate a non-browser runtime. The server commits
    // the same initial frame that the client must hydrate from.
    const serverHTML = renderServerHTML(makeApp());

    expect(serverHTML).toContain('data-testid="home"');
    expect(serverHTML).not.toContain('data-testid="article"');

    // --- Client hydration of that server HTML.
    const container = document.createElement("div");
    container.innerHTML = serverHTML;
    document.body.appendChild(container);

    // `finally` guarantees DOM + timer cleanup even if an assertion throws,
    // so a failure here cannot leak fake timers or a stray container into
    // later tests.
    try {
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

      // The destination still mounts after hydration.
      await act(async () => {
        jest.advanceTimersByTime(TRANSITION_DURATION * 2);
      });
      expect(container.querySelector('[data-testid="article"]')).not.toBeNull();
    } finally {
      document.body.removeChild(container);
      jest.useRealTimers();
    }
  });
});
