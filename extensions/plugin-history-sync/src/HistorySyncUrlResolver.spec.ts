import { createMemoryHistory } from "history";

import { createHistorySyncUrlResolver } from "./HistorySyncUrlResolver";

describe("HistorySyncUrlResolver", () => {
  test("Activity route와 URL pattern 옵션으로 URL을 생성합니다", () => {
    const urlResolver = createHistorySyncUrlResolver({
      activityRoutes: [
        {
          activityName: "Article",
          path: "/articles/$articleId",
          encode: (params: Record<string, any>) => ({
            articleId: String(params.articleId),
            source: params.source,
          }),
        },
      ],
      location: createMemoryHistory().location,
      urlPatternOptions: {
        segmentNameStartChar: "$",
      },
    });

    expect(
      urlResolver.makeActivityUrl("Article", {
        articleId: 42,
        source: "feed",
      }),
    ).toBe("/articles/42/?source=feed");
  });

  test("브라우저 진입 URL은 pathname과 query를 사용하고 초기 location을 유지합니다", () => {
    const history = createMemoryHistory({
      initialEntries: ["/articles/42?source=entry#fragment"],
    });
    const urlResolver = createHistorySyncUrlResolver({
      activityRoutes: [],
      location: history.location,
    });

    history.push("/articles/43?source=navigation");

    expect(urlResolver.resolveEntryUrl({})).toBe("/articles/42?source=entry");
  });

  test("hash 모드에서는 hash 내부 경로를 진입 URL로 해석합니다", () => {
    const history = createMemoryHistory({
      initialEntries: ["/shell?outside=1#/articles/42/?source=hash"],
    });
    const urlResolver = createHistorySyncUrlResolver({
      activityRoutes: [],
      location: history.location,
      useHash: true,
    });

    expect(urlResolver.resolveEntryUrl({})).toBe("/articles/42/?source=hash");
  });

  test("SSR request path를 브라우저 location보다 우선합니다", () => {
    const history = createMemoryHistory({
      initialEntries: ["/browser-entry"],
    });
    const urlResolver = createHistorySyncUrlResolver({
      activityRoutes: [],
      location: history.location,
    });

    expect(
      urlResolver.resolveEntryUrl({
        req: {
          path: "/server-entry?source=ssr",
        },
      }),
    ).toBe("/server-entry?source=ssr");
  });
});
