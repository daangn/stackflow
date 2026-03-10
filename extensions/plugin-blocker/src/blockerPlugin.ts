import type { StackflowReactPlugin } from "@stackflow/react";

export type BlockerPluginOptions = {
  /**
   * Return `true` to block the navigation, `false` to allow it.
   */
  shouldBlock(): boolean | Promise<boolean>;
};

export function blockerPlugin(
  options: BlockerPluginOptions,
): StackflowReactPlugin {
  return () => ({
    key: "@stackflow/plugin-blocker",
    async onBeforePush({ actions }) {
      const blocked = await options.shouldBlock();
      if (blocked) {
        actions.preventDefault();
      }
    },
    async onBeforePop({ actions }) {
      const blocked = await options.shouldBlock();
      if (blocked) {
        actions.preventDefault();
      }
    },
    async onBeforeReplace({ actions }) {
      const blocked = await options.shouldBlock();
      if (blocked) {
        actions.preventDefault();
      }
    },
  });
}
