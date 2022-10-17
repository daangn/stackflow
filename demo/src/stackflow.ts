import { basicUIPlugin } from "@stackflow/basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackDepthChangePlugin } from "@stackflow/plugin-stack-depth-change";
import { stackflow } from "@stackflow/react";

import Article from "./activities/Article";
import Main from "./activities/Main";
import TestModal from "./activities/TestModal";

const activities = {
  Main,
  Article,
  TestModal,
};

export const { Stack, useFlow } = stackflow({
  transitionDuration: 350,
  activities,
  initialActivity: () => "Main",
  plugins: [
    basicRendererPlugin(),
    stackDepthChangePlugin({
      onInit: ({ depth, activities, activeActivities }) => {},
      onDepthChanged: ({ depth, activities, activeActivities }) => {},
    }),
    basicUIPlugin({
      theme: "cupertino",
    }),
  ],
});

export type TypeActivities = typeof activities;
