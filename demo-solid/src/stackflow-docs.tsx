import { vars } from "@seed-design/design-token";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui/solid";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic/solid";
import { stackflow } from "@stackflow/solid";
import { render } from "solid-js/web";

import { activities } from "./stackflow";

const { Stack } = stackflow({
  transitionDuration: 350,
  activities,
  initialActivity: () => "Main",
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

export const renderApp = (el: HTMLElement, initialContext?: any) => {
  render(() => <Stack initialContext={initialContext} />, el);
};
