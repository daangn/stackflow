import { defineConfig } from "@stackflow/config";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import type { StackflowReactPlugin } from "@stackflow/react";
import { stackflow, useFlow } from "@stackflow/react/future";
import { act, render } from "@testing-library/react";
import React, { useCallback, useState } from "react";
import { lifecyclePlugin } from "./lifecyclePlugin";
import { useFocusEffect } from "./useFocusEffect";

declare module "@stackflow/config" {
  interface Register {
    ActivityA: {};
    ActivityB: {};
    ActivityC: {};
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
    plugins: [basicRendererPlugin(), lifecyclePlugin(), ...extraPlugins],
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

  describe("callback change while focused", () => {
    it("cleanup→re-runs when callback reference changes (useCallback deps)", async () => {
      const cleanup1 = jest.fn();
      const effect1 = jest.fn(() => cleanup1);
      const cleanup2 = jest.fn();
      const effect2 = jest.fn(() => cleanup2);
      let setArticleId!: (v: string) => void;

      function ActivityA() {
        const [articleId, _setArticleId] = useState("1");
        setArticleId = _setArticleId;

        useFocusEffect(
          useCallback(() => {
            return articleId === "1" ? effect1() : effect2();
          }, [articleId]),
        );
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
      expect(effect2).not.toHaveBeenCalled();

      // Change articleId while focused → cleanup old, run new
      await act(async () => {
        setArticleId("2");
      });

      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(effect2).toHaveBeenCalledTimes(1);
    });

    it("uses the latest callback on refocus", async () => {
      const firstEffect = jest.fn();
      const secondEffect = jest.fn();
      let setUseSecond!: (v: boolean) => void;

      function ActivityA() {
        const [useSecond, _setUseSecond] = useState(false);
        setUseSecond = _setUseSecond;

        useFocusEffect(
          useCallback(() => {
            return useSecond ? secondEffect() : firstEffect();
          }, [useSecond]),
        );
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

      // Update dep while A is active → cleanup→re-run
      await act(async () => {
        setUseSecond(true);
      });

      expect(secondEffect).toHaveBeenCalledTimes(1);

      // Push B → blur cleanup
      await act(async () => {
        actions.push("ActivityB", {});
      });

      // Pop B → refocus → secondEffect again
      await act(async () => {
        actions.pop();
      });

      expect(secondEffect).toHaveBeenCalledTimes(2);
    });
  });

  describe("cleanup called exactly once on pop", () => {
    it("does not double-invoke cleanup from both onChanged blur and useEffect unmount", async () => {
      const cleanup = jest.fn();

      function ActivityA() {
        return <div>A</div>;
      }
      function ActivityB() {
        useFocusEffect(() => cleanup);
        return <div>B</div>;
      }

      const { Stack, actions } = setupStack({ ActivityA, ActivityB });

      await act(async () => {
        render(<Stack />);
      });

      // Push B
      await act(async () => {
        actions.push("ActivityB", {});
      });

      // Pop B — triggers onChanged blur + useEffect unmount cleanup
      await act(async () => {
        actions.pop();
      });

      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe("replace", () => {
    it("runs cleanup on the replaced activity", async () => {
      const cleanupA = jest.fn();
      const effectA = jest.fn(() => cleanupA);

      function ActivityA() {
        useFocusEffect(effectA);
        return <div>A</div>;
      }
      function ActivityB() {
        return <div>B</div>;
      }

      const { Stack, actions } = setupStack({ ActivityA, ActivityB });

      await act(async () => {
        render(<Stack />);
      });

      expect(effectA).toHaveBeenCalledTimes(1);

      // Replace A with B — A blurs, B focuses
      await act(async () => {
        actions.replace("ActivityB", {});
      });

      expect(cleanupA).toHaveBeenCalledTimes(1);
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

  describe("reentrancy", () => {
    it("handles navigation inside refocus callback (onChanged path) without crash", async () => {
      // Scenario: A refocuses via pop B → A's onChanged callback pushes C
      // This triggers dispatchEvent → onChanged reentrantly from within onChanged.
      const cleanupA = jest.fn();
      let pushC: (() => void) | null = null;

      function ActivityA() {
        const { push } = useFlow();

        useFocusEffect(
          useCallback(() => {
            // On refocus, push C (triggers reentrant onChanged)
            if (pushC) {
              const fn = pushC;
              pushC = null;
              fn();
            }
            return cleanupA;
          }, []),
        );

        // Expose push for arming
        pushC = null;
        React.useEffect(() => {
          // We'll arm pushC externally before pop
        }, []);

        return <div>A</div>;
      }
      function ActivityB() {
        return <div>B</div>;
      }
      function ActivityC() {
        return <div>C</div>;
      }

      const config = defineConfig({
        activities: [
          { name: "ActivityA" as const },
          { name: "ActivityB" as const },
          { name: "ActivityC" as const },
        ],
        transitionDuration: 0,
        initialActivity: () => "ActivityA" as const,
      });

      const { Stack, actions } = stackflow({
        config,
        components: {
          ActivityA,
          ActivityB,
          ActivityC,
        },
        plugins: [basicRendererPlugin(), lifecyclePlugin()],
      });

      await act(async () => {
        render(<Stack />);
      });

      // Push B → A blurs
      await act(async () => {
        actions.push("ActivityB" as any, {});
      });

      expect(cleanupA).toHaveBeenCalledTimes(1);

      // Arm: when A refocuses via onChanged, push C
      pushC = () => actions.push("ActivityC" as any, {});

      // Pop B → A refocuses (onChanged) → callback pushes C (reentrant onChanged)
      // Should not crash or corrupt state
      await act(async () => {
        actions.pop();
      });

      // A's refocus callback ran and triggered push C.
      // A should have been blurred again (cleanup 2nd time) due to C being pushed.
      expect(cleanupA).toHaveBeenCalledTimes(2);
    });
  });
});
