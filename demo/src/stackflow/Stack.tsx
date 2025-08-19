import { vars } from "@seed-design/design-token";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { lazy, stackflow } from "@stackflow/react/future";
import { ArticleLayout } from "../activities/Article/Article.layout";
import ArticleLoading from "../activities/Article/Article.loading";
import Main from "../activities/Main/Main";
import { config } from "./stackflow.config";

export const { Stack, actions } = stackflow({
  config,
  components: {
    Main,
    Article: {
      content: lazy(() => import("../activities/Article/Article")),
      loading: ArticleLoading,
      layout: ArticleLayout,
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
        backButton: {
          ariaLabel: "뒤로 가기",
        },
        closeButton: {
          ariaLabel: "닫기",
        },
      },
    }),
    historySyncPlugin({
      config,
      fallbackActivity: () => "Main",
    }),
  ],
});

export type Actions = typeof actions;
