/**
 * Harness app root. No StrictMode (and served as a production build) so that
 * development-mode double-invocation never perturbs the fallback count or the
 * settle observation.
 */

import { useEffect, useMemo } from "react";
import { markReady } from "./bridge";
import { buildStack } from "./buildStack";
import { LifecyclePanel } from "./components/LifecyclePanel";
import { HarnessConfigContext } from "./HarnessConfigContext";
import { getCoreActions } from "./plugins/spyPlugin";
import { parseHarnessConfig, readHarnessSearch } from "./query";

export function App() {
  const harnessConfig = useMemo(
    () => parseHarnessConfig(readHarnessSearch()),
    [],
  );
  const { Stack } = useMemo(() => buildStack(harnessConfig), [harnessConfig]);

  useEffect(() => {
    // Signal readiness once the initial route has reached idle.
    let raf = 0;
    const check = () => {
      const actions = getCoreActions();
      if (actions && actions.getStack().globalTransitionState === "idle") {
        markReady();
        return;
      }
      raf = requestAnimationFrame(check);
    };
    check();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <HarnessConfigContext.Provider value={harnessConfig}>
      <Stack />
      <LifecyclePanel />
    </HarnessConfigContext.Provider>
  );
}
