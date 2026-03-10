import { defineConfig } from "@stackflow/config";
import type { Stack } from "@stackflow/core";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import type { StackflowReactPlugin } from "@stackflow/react";
import { stackflow } from "@stackflow/react/future";
import { act, render } from "@testing-library/react";
import React from "react";
import {
  type BlockedNavigation,
  blockerPlugin,
  useBlocker,
} from "./blockerPlugin";

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

  describe("1-2. 기본 허용", () => {
    it("shouldBlock이 false를 반환하면 네비게이션이 허용된다", async () => {
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
          shouldBlock: () => false,
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

      // when
      const activitiesBefore = getStack().activities;
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBefore.length + 1);
      expect(activities[activities.length - 1].name).toBe("OtherActivity");
      expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
    });
  });

  describe("1-3. 이벤트 선택적 차단", () => {
    it("Replaced는 차단하고 Pushed는 허용할 수 있다", async () => {
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
          shouldBlock: (event) => event.name === "Replaced",
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

      // when: replace → 차단
      await act(async () => {
        actions.replace("OtherActivity", {});
      });

      // then: stack 변화 없음
      expect(getStack().activities).toEqual(activitiesBefore);

      // when: push → 허용
      const activitiesBeforePush = getStack().activities;
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then: OtherActivity가 추가됨
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBeforePush.length + 1);
      expect(activities[activities.length - 1].name).toBe("OtherActivity");
      expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
    });

    it("shouldBlock은 마지막으로 commit된 render에서 전달된 함수를 사용한다", async () => {
      // given: 모든 네비게이션을 차단하는 상태
      let getStack!: () => Stack;
      let setBlocking!: (v: boolean) => void;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        const [blocking, setB] = React.useState(true);
        React.useEffect(() => {
          setBlocking = setB;
        }, []);
        useBlocker({
          shouldBlock: () => blocking,
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

      // when: 모든 네비게이션을 허용하도록 변경
      await act(async () => {
        setBlocking(false);
      });

      // when: push 시도
      const activitiesBeforePush = getStack().activities;
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then: 허용됨 (최신 shouldBlock 반영)
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBeforePush.length + 1);
      expect(activities[activities.length - 1].name).toBe("OtherActivity");
      expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
    });
  });

  describe("1-4. Activity 스코프", () => {
    it("액티비티 위에 다른 액티비티가 push되면 밑에 있던 액티비티의 블로커는 비활성화된다", async () => {
      // given
      let getStack!: () => Stack;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        // pop만 차단
        useBlocker({
          shouldBlock: (event) => event.name === "Popped",
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

      // OtherActivity push (push는 허용됨)
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // when: OtherActivity pop (TestActivity 블로커가 비활성이면 허용됨)
      const activeCountBeforePop = getStack().activities.filter(
        (a) =>
          a.transitionState === "enter-done" ||
          a.transitionState === "enter-active",
      ).length;
      await act(async () => {
        actions.pop();
      });

      // then: pop 성공 (TestActivity 블로커 비활성)
      const activeCountAfterPop = getStack().activities.filter(
        (a) =>
          a.transitionState === "enter-done" ||
          a.transitionState === "enter-active",
      ).length;
      expect(activeCountAfterPop).toBe(activeCountBeforePop - 1);
    });

    it("액티비티 위에 push되어있던 모든 액티비티가 pop으로 exit되면 밑에 있던 액티비티의 블로커가 다시 활성화된다", async () => {
      // given
      let getStack!: () => Stack;
      let setBlocking!: (v: boolean) => void;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        const [blocking, setB] = React.useState(false);
        React.useEffect(() => {
          setBlocking = setB;
        }, []);
        useBlocker({
          shouldBlock: () => blocking,
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

      // 셋업: [TestActivity(inactive, blocking=true), OtherActivity(active)]
      await act(async () => {
        actions.push("OtherActivity", {});
      });
      await act(async () => {
        setBlocking(true);
      });

      // when: 원래 OtherActivity pop → TestActivity 재활성화
      await act(async () => {
        actions.pop();
      });

      // when: push 시도
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then: 차단됨 (TestActivity 블로커 재활성)
      const activeActivities = getStack().activities.filter(
        (a) =>
          a.transitionState === "enter-done" ||
          a.transitionState === "enter-active",
      );
      expect(activeActivities).toHaveLength(1);
      expect(activeActivities[0].name).toBe("TestActivity");
    });

    it("액티비티가 replace되면 해당 액티비티의 블로커는 비활성화된다", async () => {
      // given
      let getStack!: () => Stack;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        // push는 차단하지만 replace는 허용
        useBlocker({
          shouldBlock: (event) => event.name === "Pushed",
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

      // replace는 허용됨 → TestActivity 제거
      await act(async () => {
        actions.replace("OtherActivity", {});
      });

      // when: OtherActivity active 상태에서 push
      const activitiesBeforePush = getStack().activities;
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then: 성공 (ghost blocker가 남아있다면 이 push가 차단됐을 것)
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBeforePush.length + 1);
      expect(activities[activities.length - 1].name).toBe("OtherActivity");
      expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
    });

    it("액티비티가 pop되면 해당 액티비티의 블로커는 비활성화된다", async () => {
      // given
      let getStack!: () => Stack;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function OtherActivity() {
        return <div>Other</div>;
      }

      function TestActivity() {
        // push는 차단하지만 pop은 허용
        useBlocker({
          shouldBlock: (event) => event.name === "Pushed",
          onBlocked: () => {},
        });
        return <div>Test</div>;
      }

      const config = defineConfig({
        activities: [{ name: "OtherActivity" }, { name: "TestActivity" }],
        transitionDuration: 0,
        initialActivity: () => "OtherActivity",
      });

      const { Stack, actions } = stackflow({
        config,
        components: { OtherActivity, TestActivity },
        plugins: [blockerPlugin(), basicRendererPlugin(), spyPlugin],
      });

      render(<Stack />);

      // OtherActivity에 블로커 없음 → TestActivity push 허용
      await act(async () => {
        actions.push("TestActivity", {});
      });

      // TestActivity의 shouldBlock은 Pushed만 차단 → pop은 허용
      await act(async () => {
        actions.pop();
      });

      // when: OtherActivity active 상태에서 push
      const activitiesBeforePush = getStack().activities;
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then: 성공 (ghost blocker가 남아있다면 이 push가 차단됐을 것)
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBeforePush.length + 1);
      expect(activities[activities.length - 1].name).toBe("OtherActivity");
      expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
    });
  });

  describe("2. 통보", () => {
    it("블로커가 네비게이션을 차단하면 onBlocked가 호출된다", async () => {
      // given
      const onBlocked = jest.fn();

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked,
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
        plugins: [blockerPlugin(), basicRendererPlugin()],
      });

      render(<Stack />);

      // when
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then
      expect(onBlocked).toHaveBeenCalledTimes(1);
      expect(onBlocked).toHaveBeenCalledWith({
        event: expect.objectContaining({ name: "Pushed" }),
      });
    });

    it("차단하지 않은 블로커의 onBlocked는 호출되지 않는다", async () => {
      // given
      const onBlockedA = jest.fn();
      const onBlockedB = jest.fn();

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: onBlockedA,
        });
        useBlocker({
          shouldBlock: () => false,
          onBlocked: onBlockedB,
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
        plugins: [blockerPlugin(), basicRendererPlugin()],
      });

      render(<Stack />);

      // when
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then
      expect(onBlockedA).toHaveBeenCalledTimes(1);
      expect(onBlockedB).not.toHaveBeenCalled();
    });

    it("차단되지 않은 네비게이션에 대해서는 onBlocked가 호출되지 않는다", async () => {
      // given
      const onBlocked = jest.fn();

      function TestActivity() {
        useBlocker({
          shouldBlock: () => false,
          onBlocked,
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
        plugins: [blockerPlugin(), basicRendererPlugin()],
      });

      render(<Stack />);

      // when
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then
      expect(onBlocked).not.toHaveBeenCalled();
    });
  });

  describe("3-1. 기본 bypass", () => {
    it("bypass(blockedNavigation)를 호출하면 차단된 네비게이션이 재시도된다", async () => {
      // given
      let getStack!: () => Stack;
      let bypassFn!: (b: BlockedNavigation) => void;
      let lastBlocked: BlockedNavigation | null = null;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        const { bypass } = useBlocker({
          shouldBlock: () => true,
          onBlocked: (b) => {
            lastBlocked = b;
          },
        });
        React.useEffect(() => {
          bypassFn = bypass;
        }, []);
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

      // when
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      const activitiesBeforeBypass = getStack().activities;

      await act(async () => {
        bypassFn(lastBlocked!);
      });

      // then
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBeforeBypass.length + 1);
      expect(activities[activities.length - 1].name).toBe("OtherActivity");
      expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
    });

    it("재시도되는 네비게이션의 이벤트는 차단되었던 네비게이션의 이벤트와 다른 id를 갖는다", async () => {
      // given
      let getStack!: () => Stack;
      let bypassFn!: (b: BlockedNavigation) => void;
      let lastBlocked: BlockedNavigation | null = null;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        const { bypass } = useBlocker({
          shouldBlock: () => true,
          onBlocked: (b) => {
            lastBlocked = b;
          },
        });
        React.useEffect(() => {
          bypassFn = bypass;
        }, []);
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

      // when
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      const blockedEventId = lastBlocked!.event.id;

      await act(async () => {
        bypassFn(lastBlocked!);
      });

      // then
      const activities = getStack().activities;
      const retriedActivity = activities[activities.length - 1];
      expect(retriedActivity.enteredBy.id).not.toBe(blockedEventId);
    });
  });
});
