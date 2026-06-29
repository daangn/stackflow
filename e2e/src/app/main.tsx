import { createRoot } from "react-dom/client";
import { App } from "./App";
import { installBridge } from "./bridge";

// Install the bridge before the first render so drivers can poll `ready`.
installBridge();

const container = document.getElementById("root");
if (!container) {
  throw new Error("missing #root");
}
createRoot(container).render(<App />);
