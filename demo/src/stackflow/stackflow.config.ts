import {
  createConfig,
  defineActivity,
  defineParamTypes,
} from "@stackflow/core/future";

export const config = createConfig({
  activities: [
    defineActivity({
      name: "Main" as const,
      path: "/",
    }),
    defineActivity({
      name: "Article" as const,
      path: "/articles/:articleId",
      paramTypes: defineParamTypes<{
        articleId: string;
      }>(),
    }),
  ],
  transitionDuration: 270,
  initialActivity: () => "Main",
});
