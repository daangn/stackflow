import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { renderPlugin } from "@stackflow/plugin-render";
import { stackflow } from "@stackflow/react";

import Article from "./Article";
import Home from "./Home";

const activities = {
  Home,
  Article,
};

export const { Stack, useFlow } = stackflow({
  activities,
  transitionDuration: 300,
  plugins: [
    renderPlugin({
      persist: true,
    }),
    historySyncPlugin<typeof activities>({
      routes: {
        Home: "/",
        Article: "/articles/:articleId",
      },
    }),
    () => ({
      key: "my",
      onChanged() {
        console.log("Hello");
      },
    }),
  ],
});
