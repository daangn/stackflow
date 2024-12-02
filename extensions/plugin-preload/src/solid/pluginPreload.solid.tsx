/* @jsxImportSource solid-js */

import type { StackflowSolidPlugin } from "@stackflow/solid";

import { makePreloadPlugin } from "../common/makePreloadPlugin";
import { LoadersProvider } from "./LoadersContext.solid";

export const preloadPlugin = makePreloadPlugin<StackflowSolidPlugin>(
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
