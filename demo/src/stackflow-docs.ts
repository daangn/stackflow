import { vars } from "@seed-design/design-token";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow } from "@stackflow/react";

import { activities } from "./stackflow";

export const { Stack } = stackflow({
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
