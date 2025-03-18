import { defineConfig } from "@stackflow/config";
import { articleLoader } from "../activities/Article.loader";
import { mainLoader } from "../activities/Main.loader";

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
      },
      loader: articleLoader,
    },
  ],
  transitionDuration: 270,
  initialActivity: () => "Main",
});
