import type { StackflowReactPlugin } from "@stackflow/react";

import { makePreloadPlugin } from "../common/makePreloadPlugin";
import { LoadersProvider } from "./LoadersContext";

export const preloadPlugin = makePreloadPlugin<StackflowReactPlugin>(
  ({ options }) => ({
    wrapStack({ stack }) {
      return (
        <LoadersProvider loaders={options.loaders}>
          {stack.render()}
        </LoadersProvider>
      );
    },
  }),
);
