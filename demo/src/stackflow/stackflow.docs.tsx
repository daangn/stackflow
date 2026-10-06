import { vars } from "@seed-design/design-token";
import { LinkUrlResolverProvider } from "@stackflow/link";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow } from "@stackflow/react";
import { createMemoryHistory } from "history";
import { Article } from "../activities/Article/Article";
import Main from "../activities/Main/Main";
import { config } from "./stackflow.config";

// The docs router owns the browser URL, so the embedded demo needs its own history.
const historySync = historySyncPlugin({
  config,
  fallbackActivity: () => "Main",
  history: createMemoryHistory(),
});

const { Stack: DemoStack } = stackflow({
  config,
  components: {
    Main,
    Article,
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
    historySync,
  ],
});

export const Stack: typeof DemoStack = (props) => (
  <LinkUrlResolverProvider resolver={historySync.urlResolver}>
    <DemoStack {...props} />
  </LinkUrlResolverProvider>
);
