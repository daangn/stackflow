import {
  createConfig,
  defineActivity,
  defineParamTypes,
} from "@stackflow/core/future";
import { loader as articleLoader } from "../activities/Article.loader";
import { loader as mainLoader } from "../activities/Main.loader";

export const config = createConfig({
  activities: [
    defineActivity({
      name: "Main" as const,
      path: "/",
      loader: mainLoader,
    }),
    defineActivity({
      name: "Article" as const,
      path: "/articles/:articleId",
      paramTypes: defineParamTypes<{
        articleId: string;
        title: string;
      }>(),
      loader: articleLoader,
    }),
  ],
  transitionDuration: 270,
  initialActivity: () => "Main",
});
