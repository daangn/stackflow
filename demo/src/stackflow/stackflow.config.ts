import { createConfig, defineActivity } from "@stackflow/core/future";

export const config = createConfig({
  activities: [
    defineActivity({
      name: "Main" as const,
      path: "/",
    }),
    defineActivity({
      name: "Article" as const,
      path: "/articles/:articleId",
    }),
  ],
});
