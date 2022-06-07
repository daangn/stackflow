import React from "react";
import ReactDOM from "react-dom/client";

import { StackflowCoreProvider } from "../src/StackflowCoreProvider";
import App from "./App";

const TRANSITION_DURATION = 300;

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <StackflowCoreProvider transitionDuration={TRANSITION_DURATION}>
    <App />
  </StackflowCoreProvider>,
);
