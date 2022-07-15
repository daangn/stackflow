import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow } from "@stackflow/react";

import Article from "./activities/Article";
import Main from "./activities/Main";

const activities = {
  Main,
  Article,
};
export const { Stack, useFlow } = stackflow({
  transitionDuration: 350,
  activities,
  initialActivity: () => "Main",
  plugins: [
    basicRendererPlugin(),
    historySyncPlugin({
      routes: {
        Main: "/",
        Article: "/articles/:articleId",
      },
      fallbackActivity: () => "Main",
    }),
  ],
});
