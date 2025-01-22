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
      route: "/articles/:articleId",
      loader: articleLoader,
    },
  ],
  transitionDuration: 270,
  initialActivity: () => "Main",
});
