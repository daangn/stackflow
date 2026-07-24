import { defineConfig } from "@stackflow/config";
import type { Stack } from "@stackflow/core";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import type { StackflowReactPlugin } from "@stackflow/react";
import { stackflow, useFlow } from "@stackflow/react";
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
        initialActivity: () => "OtherActivity",
      });

      const { Stack, actions } = stackflow({
        config,
        components: { TestActivity, OtherActivity },
        plugins: [blockerPlugin(), basicRendererPlugin(), spyPlugin],
      });

      render(<Stack />);

      await act(async () => {
        actions.push("TestActivity", {});
      });

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

    it("shouldBlock이 true를 반환하면 pushStep이 차단된다", async () => {
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

    it("shouldBlock이 true를 반환하면 popStep이 차단된다", async () => {
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
          shouldBlock: (action) => action.name === "StepPopped",
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

    it("shouldBlock이 true를 반환하면 replaceStep이 차단된다", async () => {
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
          shouldBlock: (action) => action.name === "StepReplaced",
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

  describe("1-3. 액션 선택적 차단", () => {
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
          shouldBlock: (action) => action.name === "Replaced",
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
          shouldBlock: (action) => action.name === "Popped",
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
          shouldBlock: (action) => action.name === "Pushed",
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
          shouldBlock: (action) => action.name === "Pushed",
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
      expect(onBlocked).toHaveBeenCalledWith(
        { action: expect.objectContaining({ name: "Pushed" }) },
        { proceed: expect.any(Function) },
      );
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

  describe("3-1. 기본 proceed", () => {
    it("단일 블로커일 때 proceed() 호출 시 차단된 네비게이션이 실행된다", async () => {
      // given
      let getStack!: () => Stack;
      let capturedProceed!: () => void;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: (_, { proceed }) => {
            capturedProceed = proceed;
          },
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

      // when: 네비게이션 시도 → 차단됨 → proceed 캡처
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      const activitiesBeforeProceed = getStack().activities;

      // when: proceed 호출 → 차단 집합 비어짐 → 네비게이션 실행
      await act(async () => {
        capturedProceed();
      });

      // then
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBeforeProceed.length + 1);
      expect(activities[activities.length - 1].name).toBe("OtherActivity");
      expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
    });
  });

  describe("3-2. 차단 집합에서 호출 블로커만 제거", () => {
    it("다중 블로커에서 proceed는 호출한 블로커만 차단 집합에서 제거한다. 다른 블로커가 남아있으면 네비게이션은 실행되지 않는다", async () => {
      // given
      let getStack!: () => Stack;
      let capturedProceedA!: () => void;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: (_, { proceed }) => {
            capturedProceedA = proceed;
          },
        });
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

      // when: 네비게이션 시도 → A, B 모두 차단
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      const activitiesBeforeProceed = getStack().activities;

      // when: A만 proceed → B가 남아있으므로 네비게이션 미실행
      await act(async () => {
        capturedProceedA();
      });

      // then
      const activitiesAfter = getStack().activities;
      expect(activitiesAfter).toEqual(activitiesBeforeProceed);
    });
  });

  describe("3-3. 모든 블로커 proceed 시 네비게이션 실행", () => {
    it("다중 블로커에서 모든 블로커가 proceed를 호출하면 네비게이션이 실행된다", async () => {
      // given
      let getStack!: () => Stack;
      let capturedProceedA!: () => void;
      let capturedProceedB!: () => void;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: (_, { proceed }) => {
            capturedProceedA = proceed;
          },
        });
        useBlocker({
          shouldBlock: () => true,
          onBlocked: (_, { proceed }) => {
            capturedProceedB = proceed;
          },
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

      // when: 네비게이션 시도 → A, B 모두 차단
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      const activitiesBeforeProceed = getStack().activities;

      // when: A proceed → B 남아있으므로 미실행
      await act(async () => {
        capturedProceedA();
      });

      // when: B proceed → 차단 집합 비어짐 → 네비게이션 실행
      await act(async () => {
        capturedProceedB();
      });

      // then
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBeforeProceed.length + 1);
      expect(activities[activities.length - 1].name).toBe("OtherActivity");
      expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
    });
  });

  describe("3-4. 멱등성", () => {
    it("proceed를 여러 번 호출해도 한 번만 동작한다", async () => {
      // given
      let getStack!: () => Stack;
      let capturedProceed!: () => void;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: (_, { proceed }) => {
            capturedProceed = proceed;
          },
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

      // when: 네비게이션 시도 → 차단
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      const activitiesBeforeProceed = getStack().activities;

      // when: proceed 두 번 호출
      await act(async () => {
        capturedProceed();
        capturedProceed();
      });

      // then: 네비게이션은 한 번만 실행됨
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBeforeProceed.length + 1);
    });
  });

  describe("4. Composition (다중 블로커)", () => {
    it("복수 블로커 등록 시, shouldBlock이 true인 모든 훅의 onBlocked가 호출된다", async () => {
      // given
      const onBlockedA = jest.fn();
      const onBlockedB = jest.fn();

      function TestActivity() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: onBlockedA,
        });
        useBlocker({
          shouldBlock: () => true,
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
      expect(onBlockedA).toHaveBeenCalledWith(
        { action: expect.objectContaining({ name: "Pushed" }) },
        { proceed: expect.any(Function) },
      );
      expect(onBlockedB).toHaveBeenCalledTimes(1);
      expect(onBlockedB).toHaveBeenCalledWith(
        { action: expect.objectContaining({ name: "Pushed" }) },
        { proceed: expect.any(Function) },
      );
    });

    it("하나의 블로커만 shouldBlock: true이면 그 블로커의 onBlocked만 호출된다", async () => {
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

    it("하나의 블로커의 shouldBlock이라도 true를 반환하면 내비게이션이 차단된다", async () => {
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

      const activitiesBefore = getStack().activities;

      // when
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then
      const activitiesAfter = getStack().activities;
      expect(activitiesAfter).toEqual(activitiesBefore);
    });

    it("모든 블로커의 shouldBlock이 false를 반환하면 내비게이션이 허용된다", async () => {
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

      const activitiesBefore = getStack().activities;

      // when
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

  describe("5. Lifecycle", () => {
    it("블로커를 소유한 컴포넌트가 unmount되면 해당 블로커는 더 이상 차단 여부에 영향을 주지 않는다", async () => {
      // given
      let getStack!: () => Stack;
      let setShowChild!: (v: boolean) => void;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function BlockerChild() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: () => {},
        });
        return <div>Child</div>;
      }

      function TestActivity() {
        const [showChild, setShow] = React.useState(true);
        React.useEffect(() => {
          setShowChild = setShow;
        }, []);
        return <div>{showChild && <BlockerChild />}</div>;
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
        setShowChild(false);
      });

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

    it("블로커를 소유한 컴포넌트가 unmount되면 해당 블로커의 onBlocked도 더 이상 호출되지 않는다", async () => {
      // given
      let setShowChild!: (v: boolean) => void;
      const onBlockedChild = jest.fn();

      function BlockerChild() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: onBlockedChild,
        });
        return <div>Child</div>;
      }

      function TestActivity() {
        const [showChild, setShow] = React.useState(true);
        React.useEffect(() => {
          setShowChild = setShow;
        }, []);
        useBlocker({
          shouldBlock: () => true,
          onBlocked: () => {},
        });
        return <div>{showChild && <BlockerChild />}</div>;
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
        setShowChild(false);
      });

      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then
      expect(onBlockedChild).not.toHaveBeenCalled();
    });

    it("블로커를 소유한 컴포넌트가 unmount되어도 이전에 캡처된 proceed는 호출 가능하다. 해당 블로커는 차단 집합에서 제거되지만, 다른 블로커가 남아있으면 네비게이션은 실행되지 않는다", async () => {
      // given
      let getStack!: () => Stack;
      let setShowChild!: (v: boolean) => void;
      let capturedProceedChild!: () => void;
      const onBlockedParent = jest.fn();

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function BlockerChild() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: (_, { proceed }) => {
            capturedProceedChild = proceed;
          },
        });
        return <div>Child</div>;
      }

      function TestActivity() {
        const [showChild, setShow] = React.useState(true);
        React.useEffect(() => {
          setShowChild = setShow;
        }, []);
        useBlocker({
          shouldBlock: () => true,
          onBlocked: onBlockedParent,
        });
        return <div>{showChild && <BlockerChild />}</div>;
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

      // when: 네비게이션 시도 → 두 블로커 모두 차단
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      const activitiesBeforeProceed = getStack().activities;

      // when: child unmount 후 캡처된 proceed 호출
      await act(async () => {
        setShowChild(false);
      });

      await act(async () => {
        capturedProceedChild();
      });

      // then — child의 proceed로 차단 집합에서 제거되지만, parent blocker가 남아있어 네비게이션은 실행되지 않음
      const activitiesAfter = getStack().activities;
      expect(activitiesAfter).toEqual(activitiesBeforeProceed);
    });

    it("블로커를 소유한 컴포넌트가 unmount되어도 이전에 캡처된 proceed는 호출 가능하다. 해당 블로커는 차단 집합에서 제거된다. 해당 블로커가 유일한 블로커였으면 내비게이션이 실행된다", async () => {
      // given
      let getStack!: () => Stack;
      let setShowChild!: (v: boolean) => void;
      let capturedProceedChild!: () => void;

      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });

      function BlockerChild() {
        useBlocker({
          shouldBlock: () => true,
          onBlocked: (_, { proceed }) => {
            capturedProceedChild = proceed;
          },
        });
        return <div>Child</div>;
      }

      function TestActivity() {
        const [showChild, setShow] = React.useState(true);
        React.useEffect(() => {
          setShowChild = setShow;
        }, []);
        return <div>{showChild && <BlockerChild />}</div>;
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

      // when: 네비게이션 시도 → 차단
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      const activitiesBeforeProceed = getStack().activities;

      // when: child unmount 후 캡처된 proceed 호출
      await act(async () => {
        setShowChild(false);
      });

      await act(async () => {
        capturedProceedChild();
      });

      // then — 유일한 블로커의 proceed이므로 차단 집합이 비어짐 → 네비게이션 실행
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBeforeProceed.length + 1);
      expect(activities[activities.length - 1].name).toBe("OtherActivity");
      expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
    });
  });

  describe("6. 오류 격리", () => {
    it("하나의 블로커의 onBlocked가 오류를 던져도 다른 블로커의 onBlocked는 정상 호출된다", async () => {
      // given
      const onBlockedB = jest.fn();
      const onError = jest.fn();
      const thrownError = new Error("BlockerA error");

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
        useBlocker({
          shouldBlock: () => true,
          onBlocked: onBlockedB,
        });
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
        plugins: [blockerPlugin({ onError }), basicRendererPlugin()],
      });

      render(<Stack />);

      // when
      await act(async () => {
        actions.push("OtherActivity", {});
      });

      // then
      expect(onBlockedB).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(thrownError);
    });
  });

  describe("7. 알림 순서", () => {
    it("onBlocked 안에서 시작된 내비게이션의 onBlocked는 현재 onBlocked가 반환된 후 호출된다", async () => {
      // given
      const callLog: string[] = [];

      function TestActivity() {
        const { replace } = useFlow();
        useBlocker({
          shouldBlock: () => true,
          onBlocked: ({ action }) => {
            if (action.name === "Pushed") {
              callLog.push("push:start");
              replace("OtherActivity", {});
              // replace의 onBlocked가 재진입으로 호출됐다면 이 시점에 'replace'가 찍혀 있을 것
              callLog.push("push:end");
            } else if (action.name === "Replaced") {
              callLog.push("replace");
            }
          },
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

      // then: push가 완전히 끝난 뒤 replace가 호출된다
      expect(callLog).toEqual(["push:start", "push:end", "replace"]);
    });

    it("onBlocked는 내비게이션 발생 순서대로 호출된다", async () => {
      // given
      const callLog: string[] = [];

      function BlockerB1() {
        const { replace } = useFlow();
        useBlocker({
          shouldBlock: () => true,
          onBlocked: ({ action }) => {
            if (action.name === "Pushed") {
              callLog.push("B1:push");
              replace("OtherActivity", {}); // B1의 push onBlocked 안에서 replace 시도
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

      // then: push 알림이 모두 끝난 뒤 replace 알림이 순서대로 온다
      expect(callLog).toEqual([
        "B1:push",
        "B2:push",
        "B1:replace",
        "B2:replace",
      ]);
    });
  });

  describe("8. proceed 시 다른 플러그인과의 상호작용", () => {
    describe("8-1. blockerPlugin보다 먼저 적용된 플러그인", () => {
      it("proceed로 replay될 때 earlier 플러그인의 onBefore* 훅이 호출된다", async () => {
        // given
        let capturedProceed!: () => void;
        let beforePushCallCount = 0;

        const earlyPlugin: StackflowReactPlugin = () => ({
          key: "early",
          onBeforePush() {
            beforePushCallCount++;
          },
        });

        function TestActivity() {
          useBlocker({
            shouldBlock: () => true,
            onBlocked: (_, { proceed }) => {
              capturedProceed = proceed;
            },
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
          plugins: [earlyPlugin, blockerPlugin(), basicRendererPlugin()],
        });

        render(<Stack />);

        await act(async () => {
          actions.push("OtherActivity", {});
        });

        // when: proceed
        await act(async () => {
          capturedProceed();
        });

        // then: earlyPlugin의 onBeforePush가 replay 시에도 호출됨
        expect(beforePushCallCount).toBe(2);
      });

      it("earlier 플러그인이 replay 중 다른 내비게이션을 실행해도 해당 내비게이션은 blocker 판단을 거친다", async () => {
        // given
        let capturedProceed!: () => void;
        let shouldBlockCalls: string[] = [];
        let pushCallCount = 0;

        const earlyPlugin: StackflowReactPlugin = () => ({
          key: "early",
          onBeforePush({ actions: hookActions }) {
            pushCallCount++;
            if (pushCallCount === 2) {
              // replay 중 별도의 pop을 실행
              hookActions.pop();
            }
          },
        });

        function TestActivity() {
          useBlocker({
            shouldBlock: (action) => {
              shouldBlockCalls.push(action.name);
              return action.name === "Pushed";
            },
            onBlocked: (_, { proceed }) => {
              capturedProceed = proceed;
            },
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
          plugins: [earlyPlugin, blockerPlugin(), basicRendererPlugin()],
        });

        render(<Stack />);

        await act(async () => {
          actions.push("OtherActivity", {});
        });

        shouldBlockCalls = [];

        // when: proceed → replay → earlyPlugin이 pop 실행
        await act(async () => {
          capturedProceed();
        });

        // then: earlyPlugin이 실행한 pop이 blocker의 shouldBlock을 거침
        expect(shouldBlockCalls).toContain("Popped");
      });

      it("earlier 플러그인이 replay 중 preventDefault하면 replay가 취소된다", async () => {
        // given
        let capturedProceed!: () => void;
        let getStack!: () => Stack;
        let pushCallCount = 0;

        const earlyPlugin: StackflowReactPlugin = () => ({
          key: "early",
          onInit({ actions: a }) {
            getStack = a.getStack;
          },
          onBeforePush({ actions: hookActions }) {
            pushCallCount++;
            if (pushCallCount === 2) {
              hookActions.preventDefault();
            }
          },
        });

        function TestActivity() {
          useBlocker({
            shouldBlock: () => true,
            onBlocked: (_, { proceed }) => {
              capturedProceed = proceed;
            },
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
          plugins: [earlyPlugin, blockerPlugin(), basicRendererPlugin()],
        });

        render(<Stack />);

        await act(async () => {
          actions.push("OtherActivity", {});
        });

        const activitiesBefore = getStack().activities;

        // when: proceed → replay → earlyPlugin이 preventDefault
        await act(async () => {
          capturedProceed();
        });

        // then: push가 취소됨
        const activitiesAfter = getStack().activities;
        expect(activitiesAfter).toEqual(activitiesBefore);
      });
    });

    describe("8-2. blockerPlugin보다 나중에 적용된 플러그인", () => {
      it("proceed로 replay될 때 later 플러그인의 onBefore* 훅이 호출된다", async () => {
        // given
        let capturedProceed!: () => void;
        let beforePushCallCount = 0;

        const latePlugin: StackflowReactPlugin = () => ({
          key: "late",
          onBeforePush() {
            beforePushCallCount++;
          },
        });

        function TestActivity() {
          useBlocker({
            shouldBlock: () => true,
            onBlocked: (_, { proceed }) => {
              capturedProceed = proceed;
            },
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
          plugins: [blockerPlugin(), latePlugin, basicRendererPlugin()],
        });

        render(<Stack />);

        // when: push → blocked
        await act(async () => {
          actions.push("OtherActivity", {});
        });

        expect(beforePushCallCount).toBe(1);

        // when: proceed
        await act(async () => {
          capturedProceed();
        });

        // then: latePlugin의 onBeforePush가 replay 시에도 호출됨
        expect(beforePushCallCount).toBe(2);
      });

      it("later 플러그인이 replay 중 다른 내비게이션을 실행해도 해당 내비게이션은 blocker 판단을 거친다", async () => {
        // given
        let capturedProceed!: () => void;
        let shouldBlockCalls: string[] = [];
        let pushCallCount = 0;

        const latePlugin: StackflowReactPlugin = () => ({
          key: "late",
          onBeforePush({ actions: hookActions }) {
            pushCallCount++;
            if (pushCallCount === 2) {
              // replay 중 별도의 pop을 실행
              hookActions.pop();
            }
          },
        });

        function TestActivity() {
          useBlocker({
            shouldBlock: (action) => {
              shouldBlockCalls.push(action.name);
              return action.name === "Pushed";
            },
            onBlocked: (_, { proceed }) => {
              capturedProceed = proceed;
            },
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
          plugins: [blockerPlugin(), latePlugin, basicRendererPlugin()],
        });

        render(<Stack />);

        await act(async () => {
          actions.push("OtherActivity", {});
        });

        shouldBlockCalls = [];

        // when: proceed → replay → latePlugin이 pop 실행
        await act(async () => {
          capturedProceed();
        });

        // then: latePlugin이 실행한 pop이 blocker의 shouldBlock을 거침
        expect(shouldBlockCalls).toContain("Popped");
      });

      it("later 플러그인이 replay 중 preventDefault하면 replay가 취소된다", async () => {
        // given
        let capturedProceed!: () => void;
        let getStack!: () => Stack;
        let pushCallCount = 0;

        const latePlugin: StackflowReactPlugin = () => ({
          key: "late",
          onBeforePush({ actions: hookActions }) {
            pushCallCount++;
            if (pushCallCount === 2) {
              hookActions.preventDefault();
            }
          },
        });

        const spyPlugin: StackflowReactPlugin = () => ({
          key: "spy",
          onInit({ actions: a }) {
            getStack = a.getStack;
          },
        });

        function TestActivity() {
          useBlocker({
            shouldBlock: () => true,
            onBlocked: (_, { proceed }) => {
              capturedProceed = proceed;
            },
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
          plugins: [
            blockerPlugin(),
            latePlugin,
            basicRendererPlugin(),
            spyPlugin,
          ],
        });

        render(<Stack />);

        await act(async () => {
          actions.push("OtherActivity", {});
        });

        const activitiesBefore = getStack().activities;

        // when: proceed → replay → latePlugin이 preventDefault
        await act(async () => {
          capturedProceed();
        });

        // then: push가 취소됨
        const activitiesAfter = getStack().activities;
        expect(activitiesAfter).toEqual(activitiesBefore);
      });
    });
  });
});
