import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow } from "@stackflow/react";

import Article from "./components/Article";
import Home from "./components/Home";

const activities = {
  Home,
  Article,
};

export const { Stack, useFlow } = stackflow({
  activities,
  transitionDuration: 350,
  initialActivity: () => "Home",
  plugins: [
    basicRendererPlugin(),
    historySyncPlugin<typeof activities>({
      routes: {
        Home: "/",
        Article: "/articles/:articleId",
      },
      fallbackActivity: () => "Home",
    }),
  ],
});
