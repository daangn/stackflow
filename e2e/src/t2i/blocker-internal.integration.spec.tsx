/** @jest-environment jsdom */
/**
 * Timing-independent blocker-internal contracts — error isolation and
 * notification order — with history-sync applied alongside the blocker. These
 * are call-sequencing/error-propagation guarantees with no real-history timing
 * dimension, so a jsdom integration with both plugins is the appropriate tier.
 * The witnesses are plugin-blocker's public onBlocked/onError behavior; the
 * coexistence requirement is met by applying history-sync and asserting the
 * stack stays consistent.
 *
 * Sources map to the original blockerPlugin suite sections 6 and 7.
 */
import { defineConfig } from "@stackflow/config";
import type { Stack } from "@stackflow/core";
import { blockerPlugin, useBlocker } from "@stackflow/plugin-blocker";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import {
  type StackflowReactPlugin,
  stackflow,
  useFlow,
} from "@stackflow/react";
import { act, render } from "@testing-library/react";
import { createMemoryHistory } from "history";

declare module "@stackflow/config" {
  interface Register {
    TestActivity: { value?: string };
    OtherActivity: Record<string, never>;
  }
}

function makeConfig() {
  return defineConfig({
    activities: [
      { name: "TestActivity", route: "/" },
      { name: "OtherActivity", route: "/other" },
    ],
    transitionDuration: 0,
    initialActivity: () => "TestActivity",
  });
}

/** history-sync + blocker applied together, history-sync registered first. */
function bothPlugins(
  config: ReturnType<typeof makeConfig>,
  blocker: StackflowReactPlugin,
  ...rest: StackflowReactPlugin[]
): StackflowReactPlugin[] {
  return [
    historySyncPlugin({
      config,
      history: createMemoryHistory(),
      fallbackActivity: () => "TestActivity",
    }),
    blocker,
    basicRendererPlugin(),
    ...rest,
  ];
}

describe("blocker internal contracts with history-sync applied", () => {
  test("one blocker's onBlocked throwing does not stop another's; the error is isolated", async () => {
    const onBlockedB = jest.fn();
    const onError = jest.fn();
    const thrownError = new Error("BlockerA error");
    let getStack!: () => Stack;

    const spy: StackflowReactPlugin = () => ({
      key: "spy",
      onInit({ actions }) {
        getStack = actions.getStack;
      },
    });

    function BlockerA() {
      useBlocker({
        shouldBlock: () => true,
        onBlocked: () => {
          throw thrownError;
        },
      });
      return null;
    }
    function BlockerB() {
      useBlocker({ shouldBlock: () => true, onBlocked: onBlockedB });
      return null;
    }
    function TestActivity() {
      return (
        <div>
          <BlockerA />
          <BlockerB />
        </div>
      );
    }
    const OtherActivity = () => <div>Other</div>;

    const config = makeConfig();
    const { Stack, actions } = stackflow({
      config,
      components: { TestActivity, OtherActivity },
      plugins: bothPlugins(config, blockerPlugin({ onError }), spy),
    });

    render(<Stack />);
    const before = getStack().activities;

    await act(async () => {
      actions.push("OtherActivity", {});
    });

    expect(onBlockedB).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(thrownError);
    // The navigation stayed blocked: the stack is unchanged.
    expect(getStack().activities).toEqual(before);
  });

  test("a navigation started inside onBlocked is notified after the current onBlocked returns", async () => {
    const callLog: string[] = [];

    function TestActivity() {
      const { replace } = useFlow();
      useBlocker({
        shouldBlock: () => true,
        onBlocked: ({ action }) => {
          if (action.name === "Pushed") {
            callLog.push("push:start");
            replace("OtherActivity", {});
            callLog.push("push:end");
          } else if (action.name === "Replaced") {
            callLog.push("replace");
          }
        },
      });
      return <div>Test</div>;
    }
    const OtherActivity = () => <div>Other</div>;

    const config = makeConfig();
    const { Stack, actions } = stackflow({
      config,
      components: { TestActivity, OtherActivity },
      plugins: bothPlugins(config, blockerPlugin()),
    });

    render(<Stack />);
    await act(async () => {
      actions.push("OtherActivity", {});
    });

    expect(callLog).toEqual(["push:start", "push:end", "replace"]);
  });

  test("onBlocked notifications fire in navigation order across nested rounds", async () => {
    const callLog: string[] = [];

    function BlockerB1() {
      const { replace } = useFlow();
      useBlocker({
        shouldBlock: () => true,
        onBlocked: ({ action }) => {
          if (action.name === "Pushed") {
            callLog.push("B1:push");
            replace("OtherActivity", {});
          } else if (action.name === "Replaced") {
            callLog.push("B1:replace");
          }
        },
      });
      return null;
    }
    function BlockerB2() {
      useBlocker({
        shouldBlock: () => true,
        onBlocked: ({ action }) => {
          if (action.name === "Pushed") {
            callLog.push("B2:push");
          } else if (action.name === "Replaced") {
            callLog.push("B2:replace");
          }
        },
      });
      return null;
    }
    function TestActivity() {
      return (
        <div>
          <BlockerB1 />
          <BlockerB2 />
        </div>
      );
    }
    const OtherActivity = () => <div>Other</div>;

    const config = makeConfig();
    const { Stack, actions } = stackflow({
      config,
      components: { TestActivity, OtherActivity },
      plugins: bothPlugins(config, blockerPlugin()),
    });

    render(<Stack />);
    await act(async () => {
      actions.push("OtherActivity", {});
    });

    expect(callLog).toEqual(["B1:push", "B2:push", "B1:replace", "B2:replace"]);
  });
});
