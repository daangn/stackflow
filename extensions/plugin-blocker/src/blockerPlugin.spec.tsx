import { defineConfig } from "@stackflow/config";
import type { Stack } from "@stackflow/core";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import type { StackflowReactPlugin } from "@stackflow/react";
import { stackflow } from "@stackflow/react/future";
import { act, render } from "@testing-library/react";
import React from "react";
import { blockerPlugin, useBlocker } from "./blockerPlugin";

declare module "@stackflow/config" {
  interface Register {
    TestActivity: {
      value?: string;
    };
    OtherActivity: {};
  }
}

describe("blockerPlugin", () => {
  describe("1-1. 기본 차단", () => {
    it("shouldBlock이 true를 반환하면 pop이 차단된다", async () => {
      // given
      let getStack!: () => Stack;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: () => {},
        });
        return <div>Test</div>;
      }

      function OtherActivity() {
        return <div>Other</div>;
      }

      const config = defineConfig({
        activities: [{ name: "TestActivity" }, { name: "OtherActivity" }],
        transitionDuration: 0,
        initialActivity: () => "TestActivity",
      });

      const { Stack, actions } = stackflow({
        config,
        components: { TestActivity, OtherActivity },
        plugins: [blockerPlugin(), basicRendererPlugin(), spyPlugin],
      });

      render(<Stack />);

      const activitiesBefore = getStack().activities;

      // when
      await act(async () => {
        actions.pop();
      });

      // then
      const activitiesAfter = getStack().activities;
      expect(activitiesAfter).toEqual(activitiesBefore);
    });

    it("shouldBlock이 true를 반환하면 push가 차단된다", async () => {
      // given
      let getStack!: () => Stack;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: () => {},
        });
        return <div>Test</div>;
      }

      function OtherActivity() {
        return <div>Other</div>;
      }

      const config = defineConfig({
        activities: [{ name: "TestActivity" }, { name: "OtherActivity" }],
        transitionDuration: 0,
        initialActivity: () => "TestActivity",
      });

      const { Stack, actions } = stackflow({
        config,
        components: { TestActivity, OtherActivity },
        plugins: [blockerPlugin(), basicRendererPlugin(), spyPlugin],
      });

      render(<Stack />);

      const activitiesBefore = getStack().activities;

      // when
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then
      const activitiesAfter = getStack().activities;
      expect(activitiesAfter).toEqual(activitiesBefore);
    });

    it("shouldBlock이 true를 반환하면 replace가 차단된다", async () => {
      // given
      let getStack!: () => Stack;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: () => {},
        });
        return <div>Test</div>;
      }

      function OtherActivity() {
        return <div>Other</div>;
      }

      const config = defineConfig({
        activities: [{ name: "TestActivity" }, { name: "OtherActivity" }],
        transitionDuration: 0,
        initialActivity: () => "TestActivity",
      });

      const { Stack, actions } = stackflow({
        config,
        components: { TestActivity, OtherActivity },
        plugins: [blockerPlugin(), basicRendererPlugin(), spyPlugin],
      });

      render(<Stack />);

      const activitiesBefore = getStack().activities;

      // when
      await act(async () => {
        actions.replace("OtherActivity", {});
      });

      // then
      const activitiesAfter = getStack().activities;
      expect(activitiesAfter).toEqual(activitiesBefore);
    });

    it("shouldBlock이 true를 반환하면 stepPush가 차단된다", async () => {
      // given
      let getStack!: () => Stack;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: () => {},
        });
        return <div>Test</div>;
      }

      function OtherActivity() {
        return <div>Other</div>;
      }

      const config = defineConfig({
        activities: [{ name: "TestActivity" }, { name: "OtherActivity" }],
        transitionDuration: 0,
        initialActivity: () => "TestActivity",
      });

      const { Stack, stepActions } = stackflow({
        config,
        components: { TestActivity, OtherActivity },
        plugins: [blockerPlugin(), basicRendererPlugin(), spyPlugin],
      });

      render(<Stack />);

      const activitiesBefore = getStack().activities;

      // when
      await act(async () => {
        stepActions.pushStep({ value: "new" });
      });

      // then
      const activitiesAfter = getStack().activities;
      expect(activitiesAfter).toEqual(activitiesBefore);
    });

    it("shouldBlock이 true를 반환하면 stepPop이 차단된다", async () => {
      // given
      let getStack!: () => Stack;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        useBlocker({
          shouldBlock: (event) => event.name === "StepPopped",
          onBlocked: () => {},
        });
        return <div>Test</div>;
      }

      function OtherActivity() {
        return <div>Other</div>;
      }

      const config = defineConfig({
        activities: [{ name: "TestActivity" }, { name: "OtherActivity" }],
        transitionDuration: 0,
        initialActivity: () => "TestActivity",
      });

      const { Stack, stepActions } = stackflow({
        config,
        components: { TestActivity, OtherActivity },
        plugins: [blockerPlugin(), basicRendererPlugin(), spyPlugin],
      });

      render(<Stack />);

      await act(async () => {
        stepActions.pushStep({ value: "initial" });
      });

      const activitiesBefore = getStack().activities;

      // when
      await act(async () => {
        stepActions.popStep();
      });

      // then
      const activitiesAfter = getStack().activities;
      expect(activitiesAfter).toEqual(activitiesBefore);
    });

    it("shouldBlock이 true를 반환하면 stepReplace가 차단된다", async () => {
      // given
      let getStack!: () => Stack;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        useBlocker({
          shouldBlock: (event) => event.name === "StepReplaced",
          onBlocked: () => {},
        });
        return <div>Test</div>;
      }

      function OtherActivity() {
        return <div>Other</div>;
      }

      const config = defineConfig({
        activities: [{ name: "TestActivity" }, { name: "OtherActivity" }],
        transitionDuration: 0,
        initialActivity: () => "TestActivity",
      });

      const { Stack, stepActions } = stackflow({
        config,
        components: { TestActivity, OtherActivity },
        plugins: [blockerPlugin(), basicRendererPlugin(), spyPlugin],
      });

      render(<Stack />);

      await act(async () => {
        stepActions.pushStep({ value: "initial" });
      });

      const activitiesBefore = getStack().activities;

      // when
      await act(async () => {
        stepActions.replaceStep({ value: "replaced" });
      });

      // then
      const activitiesAfter = getStack().activities;
      expect(activitiesAfter).toEqual(activitiesBefore);
    });
  });
});
