/** @jest-environment jsdom */
import { defineConfig } from "@stackflow/config";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import type { ActivityComponentType } from "@stackflow/react";
import { stackflow, useActivity } from "@stackflow/react";
import { act, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { useEffect } from "react";
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

type DefaultHistoryOption = "non-empty" | "empty" | "none";

function Home() {
  return <div data-testid="home">home</div>;
}
function Article() {
  return <div data-testid="article">article</div>;
}

type ActivitySnapshot = ReturnType<typeof useActivity>;

let recordHomeActivity: ((activity: ActivitySnapshot) => void) | undefined;
let recordArticleActivity: ((activity: ActivitySnapshot) => void) | undefined;

afterEach(() => {
  recordHomeActivity = undefined;
  recordArticleActivity = undefined;
});

const HomeActivity: ActivityComponentType<"Home"> = () => {
  const activity = useActivity();

  useEffect(() => {
    recordHomeActivity?.(activity);
  }, [activity]);

  return null;
};

const ArticleActivity: ActivityComponentType<"Article"> = () => {
  const activity = useActivity();

  useEffect(() => {
    recordArticleActivity?.(activity);
  }, [activity]);

  return null;
};

function makeApp({
  defaultHistory = "non-empty",
}: {
  defaultHistory?: DefaultHistoryOption;
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
    ],
  });
}

function renderHistorySyncStack({
  config,
  initialEntry,
}: {
  config: Parameters<typeof stackflow>[0]["config"];
  initialEntry: string;
}) {
  const history = createMemoryHistory({
    initialEntries: [initialEntry],
  });

  const app = stackflow({
    config,
    components: {
      Home: HomeActivity,
      Article: ArticleActivity,
    },
    plugins: [
      basicRendererPlugin(),
      historySyncPlugin({
        config,
        history,
        fallbackActivity: () => "Home",
      }),
    ],
  });

  render(<app.Stack />);

  return history;
}

function renderServerHTML(app: ReturnType<typeof makeApp>) {
  const originalWindow = global.window;
  try {
    delete (global as { window?: unknown }).window;
    return renderToString(<app.Stack initialContext={SSR_INITIAL_CONTEXT} />);
  } finally {
    (global as { window?: unknown }).window = originalWindow;
  }
}

describe("historySyncPlugin - SSR hydration with defaultHistory", () => {
  test("a route with no defaultHistory still resolves directly to the destination (unchanged)", () => {
    const app = makeApp({
      defaultHistory: "none",
    });
    const html = renderServerHTML(app);

    expect(html).toContain('data-testid="article"');
    expect(html).not.toContain('data-testid="home"');
  });

  test("an explicit empty defaultHistory resolves directly to the destination (unchanged)", () => {
    const app = makeApp({
      defaultHistory: "empty",
    });
    const html = renderServerHTML(app);

    // `defaultHistory: () => []` and a missing `defaultHistory` both yield no
    // ancestor entries, so the destination lands immediately with no staged
    // setup to replay.
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

describe("historySyncPlugin - defaultHistory setup through React rendering", () => {
  test("historySyncPlugin - FEP-1061: defaultHistory ancestor entries with typed activityParams + stepParams coerce (T-I-NEW-6)", async () => {
    const homeActivities: ActivitySnapshot[] = [];
    const articleActivities: ActivitySnapshot[] = [];
    recordHomeActivity = (activity) => {
      homeActivities.push(activity);
    };
    recordArticleActivity = (activity) => {
      articleActivities.push(activity);
    };

    const config = defineConfig({
      transitionDuration: TRANSITION_DURATION,
      activities: [
        { name: "Home", route: "/home/" },
        {
          name: "Article",
          route: {
            path: "/articles/:articleId",
            defaultHistory: () => [
              {
                activityName: "Home",
                activityParams: {
                  count: 42 as unknown as string,
                },
                additionalSteps: [
                  {
                    stepParams: {
                      offset: 7 as unknown as string,
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    });

    renderHistorySyncStack({
      config,
      initialEntry: "/articles/9/",
    });

    await waitFor(() => {
      const article = articleActivities.find((activity) => activity.isActive);

      expect(article?.params.articleId).toEqual("9");
    });

    const home = homeActivities.at(-1);
    expect(home?.steps[0]?.params.count).toEqual("42");
    expect(typeof home?.steps[0]?.params.count).toEqual("string");
    expect(home?.params.offset).toEqual("7");
    expect(typeof home?.params.offset).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: T-O-5 defaultHistory ancestor URL uses ancestor's route encode (not currentPath)", async () => {
    // Arrive on Article URL with a typed defaultHistory chain. The ancestor
    // URL pushed during setup must use Home's route encode, not the current
    // Article path.
    const homeActivities: ActivitySnapshot[] = [];
    const articleActivities: ActivitySnapshot[] = [];
    recordHomeActivity = (activity) => {
      homeActivities.push(activity);
    };
    recordArticleActivity = (activity) => {
      articleActivities.push(activity);
    };

    const homeEncode = jest.fn((params: unknown) => {
      const record =
        typeof params === "object" && params !== null
          ? (params as Record<string, unknown>)
          : {};

      return {
        articleId: String(record.articleId ?? ""),
        visible: record.visible ? "y" : "n",
      };
    });

    const config = defineConfig({
      transitionDuration: TRANSITION_DURATION,
      activities: [
        {
          name: "Home",
          route: {
            path: "/home/",
            encode: homeEncode,
          },
        },
        {
          name: "Article",
          route: {
            path: "/articles/:articleId",
            defaultHistory: () => [
              {
                activityName: "Home",
                activityParams: {
                  visible: true as unknown as string,
                },
              },
            ],
          },
        },
      ],
    });

    const history = renderHistorySyncStack({
      config,
      initialEntry: "/articles/9/?visible=true",
    });

    await waitFor(() => {
      const article = articleActivities.find((activity) => activity.isActive);

      expect(article?.params.articleId).toEqual("9");
    });

    await act(async () => {
      history.back();
    });

    await waitFor(() => {
      const { pathname, search, hash } = history.location;

      expect(homeActivities.some((activity) => activity.isActive)).toEqual(
        true,
      );
      expect(`${pathname}${search}${hash}`).toEqual("/home/?visible=y");
    });
  });
});
