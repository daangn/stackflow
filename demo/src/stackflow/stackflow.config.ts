import { defineConfig } from "@stackflow/config";
import type { ArticleParamTypes } from "../activities/Article";
import { articleLoader } from "../activities/Article.loader";
import type { MainParamTypes } from "../activities/Main";

export const config = defineConfig({
  activities: [
    { name: "Main", path: "/" },
    { name: "Article", path: "/articles/:articleId", loader: articleLoader },
  ],
  transitionDuration: 270,
  initialActivity: () => "Main",
});

declare module "@stackflow/config" {
  interface Register {
    activityParamTypes: {
      Main: MainParamTypes;
      Article: ArticleParamTypes;
    };
  }
}
