import { defineActivity, defineConfig } from "@stackflow/config";
import { z } from "zod";
import { loader as articleLoader } from "../activities/Article.loader";
import { loader as mainLoader } from "../activities/Main.loader";

export const config = defineConfig({
  activities: [
    defineActivity({
      name: "Main",
      path: "/",
      schema: z.object({
        hello: z.string(),
      }),
      loader: () => {},
      // loader: mainLoader,
    }),
    // defineActivity({
    //   name: "Article",
    //   path: "/articles/:articleId",
    //   loader: articleLoader,
    // }),
  ],
  transitionDuration: 270,
  initialActivity: () => "Main",
});
