import { vars } from "@seed-design/design-token";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { lazy, stackflow } from "@stackflow/react/future";
import Main from "../activities/Main";
import { config } from "./stackflow.config";

export const { Stack, actions } = stackflow({
  config,
  components: {
    Main,
    Article: lazy(() => import("../activities/Article")),
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
