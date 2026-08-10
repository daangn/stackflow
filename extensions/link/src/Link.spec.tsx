/** @jest-environment node */

import { defineConfig } from "@stackflow/config";
import type { StackflowReactPlugin } from "@stackflow/react";
import { stackflow } from "@stackflow/react";
import { renderToString } from "react-dom/server";
import { Link } from "./Link";
import { LinkUrlResolverProvider } from "./LinkUrlResolverContext";

declare module "@stackflow/config" {
  interface Register {
    Home: {};
    Article: {
      articleId: number;
      source: string;
    };
  }
}

function Home() {
  return (
    <Link
      activityName="Article"
      activityParams={{ articleId: 42, source: "feed" }}
    >
      Article
    </Link>
  );
}

function Article() {
  return <div>Article</div>;
}

const rendererPlugin: StackflowReactPlugin = () => ({
  key: "test-renderer",
  render({ stack }) {
    return (
      <>
        {stack.render().activities.map((activity) => (
          <div key={activity.key}>{activity.render()}</div>
        ))}
      </>
    );
  },
});

test("Link uses an injected resolver for its href", () => {
  const config = defineConfig({
    initialActivity: () => "Home",
    transitionDuration: 0,
    activities: [{ name: "Home" }, { name: "Article" }],
  });

  const { Stack } = stackflow({
    config,
    components: { Home, Article },
    plugins: [rendererPlugin],
  });

  const html = renderToString(
    <LinkUrlResolverProvider
      resolver={{
        makeActivityUrl(_activityName, activityParams) {
          return `/articles/${activityParams.articleId}/?source=${activityParams.source}`;
        },
      }}
    >
      <Stack />
    </LinkUrlResolverProvider>,
  );

  expect(html).toContain('href="/articles/42/?source=feed"');
});
