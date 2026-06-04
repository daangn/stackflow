/**
 * Smoke test that verifies the test harness itself:
 *
 * - `.spec.tsx` files are picked up by Jest and transformed by `@swc/jest`
 * - the `jsdom` environment and `@testing-library/react` work together
 * - workspace dependencies (`@stackflow/config`, `@stackflow/core`) resolve
 * - a minimal inline renderer plugin (public `render` API) renders activities,
 *   so specs do not need `@stackflow/plugin-renderer-basic` (which would
 *   create a workspace dependency cycle)
 *
 * Feel free to remove this file once real specs cover the same ground.
 */
import { defineConfig } from "@stackflow/config";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { StackflowReactPlugin } from "./index";
import { stackflow } from "./index";

declare module "@stackflow/config" {
  interface Register {
    SmokeActivity: {};
  }
}

const testRendererPlugin: StackflowReactPlugin = () => ({
  key: "test-renderer",
  render({ stack }) {
    return (
      <>
        {stack.render().activities.map((activity) => (
          <React.Fragment key={activity.key}>
            {activity.render()}
          </React.Fragment>
        ))}
      </>
    );
  },
});

describe("test harness", () => {
  it("renders an activity through a minimal inline renderer plugin", () => {
    // given
    function SmokeActivity() {
      return <div>smoke</div>;
    }

    const config = defineConfig({
      activities: [{ name: "SmokeActivity" }],
      transitionDuration: 0,
      initialActivity: () => "SmokeActivity",
    });

    const { Stack } = stackflow({
      config,
      components: { SmokeActivity },
      plugins: [testRendererPlugin],
    });

    // when
    render(<Stack />);

    // then
    expect(screen.getByText("smoke")).toBeTruthy();
  });
});
