import { defineConfig } from "@stackflow/config";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { act, render } from "@testing-library/react";
import React, { useState } from "react";
import type { StackflowReactPlugin } from "../../__internal__/StackflowReactPlugin";
import { stackflow } from "../stackflow";
import { useFocusEffect } from "./useFocusEffect";

declare module "@stackflow/config" {
  interface Register {
    ActivityA: {};
    ActivityB: {};
  }
}

function setupStack({
  ActivityA,
  ActivityB,
  extraPlugins = [],
}: {
  ActivityA: React.FC;
  ActivityB: React.FC;
  extraPlugins?: StackflowReactPlugin[];
}) {
  const config = defineConfig({
    activities: [{ name: "ActivityA" }, { name: "ActivityB" }],
    transitionDuration: 0,
    initialActivity: () => "ActivityA",
  });

  return stackflow({
    config,
    components: { ActivityA, ActivityB },
    plugins: [basicRendererPlugin(), ...extraPlugins],
  });
}

describe("lifecyclePlugin", () => {
  describe("initial focus", () => {
    it("calls the effect on initial mount when activity is active", async () => {
      const effect = jest.fn();

      function ActivityA() {
        useFocusEffect(effect);
        return <div>A</div>;
      }
      function ActivityB() {
        return <div>B</div>;
      }

      const { Stack } = setupStack({ ActivityA, ActivityB });

      await act(async () => {
        render(<Stack />);
      });

      expect(effect).toHaveBeenCalledTimes(1);
    });
  });

  describe("blur cleanup", () => {
    it("runs cleanup when another activity is pushed", async () => {
      const cleanup = jest.fn();
      const effect = jest.fn(() => cleanup);

      function ActivityA() {
        useFocusEffect(effect);
        return <div>A</div>;
      }
      function ActivityB() {
        return <div>B</div>;
      }

      const { Stack, actions } = setupStack({ ActivityA, ActivityB });

      await act(async () => {
        render(<Stack />);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(cleanup).not.toHaveBeenCalled();

      await act(async () => {
        actions.push("ActivityB", {});
      });

      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe("refocus", () => {
    it("re-runs the effect when activity returns to active after pop", async () => {
      const cleanup = jest.fn();
      const effect = jest.fn(() => cleanup);

      function ActivityA() {
        useFocusEffect(effect);
        return <div>A</div>;
      }
      function ActivityB() {
        return <div>B</div>;
      }

      const { Stack, actions } = setupStack({ ActivityA, ActivityB });

      await act(async () => {
        render(<Stack />);
      });

      expect(effect).toHaveBeenCalledTimes(1);

      // Push B on top of A → A blurs
      await act(async () => {
        actions.push("ActivityB", {});
      });

      expect(cleanup).toHaveBeenCalledTimes(1);

      // Pop B → A refocuses
      await act(async () => {
        actions.pop();
      });

      expect(effect).toHaveBeenCalledTimes(2);
    });
  });

  describe("multiple hooks in one activity", () => {
    it("calls all registered effects on focus", async () => {
      const effect1 = jest.fn();
      const effect2 = jest.fn();

      function ActivityA() {
        useFocusEffect(effect1);
        useFocusEffect(effect2);
        return <div>A</div>;
      }
      function ActivityB() {
        return <div>B</div>;
      }

      const { Stack } = setupStack({ ActivityA, ActivityB });

      await act(async () => {
        render(<Stack />);
      });

      expect(effect1).toHaveBeenCalledTimes(1);
      expect(effect2).toHaveBeenCalledTimes(1);
    });

    it("runs all cleanups on blur", async () => {
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();

      function ActivityA() {
        useFocusEffect(() => cleanup1);
        useFocusEffect(() => cleanup2);
        return <div>A</div>;
      }
      function ActivityB() {
        return <div>B</div>;
      }

      const { Stack, actions } = setupStack({ ActivityA, ActivityB });

      await act(async () => {
        render(<Stack />);
      });

      await act(async () => {
        actions.push("ActivityB", {});
      });

      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
    });
  });

  describe("unmount cleanup", () => {
    it("runs cleanup when component unmounts", async () => {
      const cleanup = jest.fn();

      function ActivityA() {
        useFocusEffect(() => cleanup);
        return <div>A</div>;
      }
      function ActivityB() {
        return <div>B</div>;
      }

      const { Stack } = setupStack({ ActivityA, ActivityB });

      const { unmount } = await act(async () => {
        return render(<Stack />);
      });

      expect(cleanup).not.toHaveBeenCalled();

      await act(async () => {
        unmount();
      });

      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe("callbackRef pattern", () => {
    it("uses the latest callback on refocus", async () => {
      const firstEffect = jest.fn();
      const secondEffect = jest.fn();
      let setUseSecond!: (v: boolean) => void;

      function ActivityA() {
        const [useSecond, _setUseSecond] = useState(false);
        setUseSecond = _setUseSecond;

        useFocusEffect(useSecond ? secondEffect : firstEffect);
        return <div>A</div>;
      }
      function ActivityB() {
        return <div>B</div>;
      }

      const { Stack, actions } = setupStack({ ActivityA, ActivityB });

      await act(async () => {
        render(<Stack />);
      });

      expect(firstEffect).toHaveBeenCalledTimes(1);
      expect(secondEffect).not.toHaveBeenCalled();

      // Update callback while A is active
      await act(async () => {
        setUseSecond(true);
      });

      // Push B → A blurs
      await act(async () => {
        actions.push("ActivityB", {});
      });

      // Pop B → A refocuses → should use secondEffect
      await act(async () => {
        actions.pop();
      });

      expect(secondEffect).toHaveBeenCalledTimes(1);
    });
  });

  describe("effect on ActivityB", () => {
    it("runs effect on pushed activity and cleans up on pop", async () => {
      const cleanupB = jest.fn();
      const effectB = jest.fn(() => cleanupB);

      function ActivityA() {
        return <div>A</div>;
      }
      function ActivityB() {
        useFocusEffect(effectB);
        return <div>B</div>;
      }

      const { Stack, actions } = setupStack({ ActivityA, ActivityB });

      await act(async () => {
        render(<Stack />);
      });

      expect(effectB).not.toHaveBeenCalled();

      // Push B
      await act(async () => {
        actions.push("ActivityB", {});
      });

      expect(effectB).toHaveBeenCalledTimes(1);

      // Pop B
      await act(async () => {
        actions.pop();
      });

      expect(cleanupB).toHaveBeenCalledTimes(1);
    });
  });
});
