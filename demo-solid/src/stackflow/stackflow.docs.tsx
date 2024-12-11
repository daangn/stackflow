import { vars } from "@seed-design/design-token";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui/solid";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic/solid";
import { stackflow } from "@stackflow/solid/future";
import { render } from "solid-js/web";
import { config } from "./stackflow.config";

import Article from "../activities/Article";
import Main from "../activities/Main";

const { Stack } = stackflow({
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
      },
    }),
  ],
});

export const renderApp = (el: HTMLElement) => {
  render(() => <Stack />, el);
};
