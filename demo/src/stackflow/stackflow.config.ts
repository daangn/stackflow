import { defineConfig } from "@stackflow/config";
import { articleLoader } from "../activities/Article.loader";
import { mainLoader } from "../activities/Main.loader";

export const config = defineConfig({
  activities: [
    {
      name: "Main",
      path: "/",
      loader: mainLoader,
    },
    {
      name: "Article",
      path: "/articles/:articleId",
      loader: articleLoader,
    },
  ],
  transitionDuration: 270,
  initialActivity: () => "Main",
});
