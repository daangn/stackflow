import { vars } from "@seed-design/design-token";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stack } from "@stackflow/react/future";
import Article from "../activities/Article";
import Main from "../activities/Main";
import { config } from "./stackflow.config";

export const { Stack, actions } = stack({
  config,
  components: {
    Main,
    Article,
  },
  useHistorySync: {
    fallbackActivity: () => "Main",
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
  ],
});

export type Actions = typeof actions;
