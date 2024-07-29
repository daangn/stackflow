import { defineConfig } from "@stackflow/config";
import { articleLoader } from "../activities/Article.loader";

export const config = defineConfig({
  activities: [
    { name: "Main", path: "/" },
    { name: "Article", path: "/articles/:articleId", loader: articleLoader },
  ],
  transitionDuration: 270,
  initialActivity: () => "Main",
});
