import { vars } from "@seed-design/design-token";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { redirectPlugin } from "@stackflow/plugin-redirect";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow } from "@stackflow/react";

import Article from "./activities/Article";
import Main from "./activities/Main";

export const { Stack, activities } = stackflow({
  transitionDuration: 350,
  activities: {
    Main,
    Article: {
      component: Article,
      paramsSchema: {
        type: "object",
        properties: {
          articleId: {
            type: "string",
          },
          title: {
            type: "string",
          },
        },
        required: ["articleId", "title"],
      },
    },
  },
  plugins: [
    basicRendererPlugin(),
    basicUIPlugin({
      theme: "cupertino",
      backgroundColor: vars.$semantic.color.paperDefault,
      appBar: {
        textColor: vars.$scale.color.gray900,
        iconColor: vars.$scale.color.gray900,
        borderColor: vars.$semantic.color.divider3,
      },
    }),
    redirectPlugin({
      redirects: {
        Article: ["Main"],
      },
    }),
    historySyncPlugin({
      routes: {
        Main: "/",
        Article: "/articles/:articleId",
      },
      fallbackActivity: () => "Main",
    }),
  ],
});

export type TypeActivities = typeof activities;
