import { defineConfig } from "@stackflow/config";
import { articleLoader } from "../activities/Article/Article.loader";
import { mainLoader } from "../activities/Main/Main.loader";

export const config = defineConfig({
  activities: [
    {
      name: "Main",
      route: "/",
      loader: mainLoader,
    },
    {
      name: "Article",
      route: {
        path: "/articles/:articleId",
        decode: (params) => ({
          articleId: Number(params.articleId),
          title: params.title,
        }),
        defaultHistory: () => [
          {
            activityName: "Main",
            activityParams: {},
          },
        ],
      },
      loader: articleLoader,
    },
  ],
  transitionDuration: 270,
  initialActivity: () => "Main",
});
