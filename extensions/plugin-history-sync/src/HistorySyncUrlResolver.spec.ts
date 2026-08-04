import { createMemoryHistory } from "history";

import { historySyncPlugin } from "./historySyncPlugin";

describe("HistorySyncUrlResolver", () => {
  test("Activity URL 생성에 대표 route, encode, URL pattern 옵션을 적용합니다", () => {
    const plugin = historySyncPlugin({
      routes: {
        Article: [
          {
            path: "/articles/*",
          },
          {
            path: "/articles/$articleId",
            encode: (params: Record<string, any>) => ({
              articleId: String(params.articleId),
              source: params.source,
            }),
          },
        ],
      },
      fallbackActivity: () => "Article",
      urlPatternOptions: {
        segmentNameStartChar: "$",
      },
    });

    expect(
      plugin.urlResolver.makeActivityUrl("Article", {
        articleId: 42,
        source: "feed",
      }),
    ).toBe("/articles/42/?source=feed");
  });

  test("브라우저 진입 URL은 pathname과 query를 사용하고 초기 location을 유지합니다", () => {
    const history = createMemoryHistory({
      initialEntries: ["/articles/42?source=entry#fragment"],
    });
    const plugin = historySyncPlugin({
      history,
      routes: {
        Article: "/articles/:articleId",
      },
      fallbackActivity: () => "Article",
    });

    history.push("/articles/43?source=navigation");

    expect(plugin.urlResolver.resolveEntryUrl({})).toBe(
      "/articles/42?source=entry",
    );
  });

  test("hash 모드에서는 hash 내부 경로를 진입 URL로 해석합니다", () => {
    const plugin = historySyncPlugin({
      history: createMemoryHistory({
        initialEntries: ["/shell?outside=1#/articles/42/?source=hash"],
      }),
      routes: {
        Article: "/articles/:articleId",
      },
      fallbackActivity: () => "Article",
      useHash: true,
    });

    expect(plugin.urlResolver.resolveEntryUrl({})).toBe(
      "/articles/42/?source=hash",
    );
  });

  test("SSR request path를 브라우저 location보다 우선합니다", () => {
    const plugin = historySyncPlugin({
      history: createMemoryHistory({
        initialEntries: ["/browser-entry"],
      }),
      routes: {
        Article: "/articles/:articleId",
      },
      fallbackActivity: () => "Article",
    });

    expect(
      plugin.urlResolver.resolveEntryUrl({
        req: {
          path: "/server-entry?source=ssr",
        },
      }),
    ).toBe("/server-entry?source=ssr");
  });
});
