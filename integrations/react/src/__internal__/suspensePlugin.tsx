import { Suspense, useEffect } from "react";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import { useCoreActions } from "./core";

export function suspensePlugin(): StackflowReactPlugin {
  return () => ({
    key: "plugin-suspense",
    wrapActivity: ({ activity }) => {
      return (
        <Suspense fallback={<SuspenseFallback />}>{activity.render()}</Suspense>
      );
    },
  });
}

export function SuspenseFallback() {
  const { pause, resume } = useCoreActions();

  useEffect(() => {
    console.log("lets pause");
    pause();

    return () => {
      console.log("lets resume");
      resume();
    };
  }, []);

  return null;
}
