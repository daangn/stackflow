import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { CoreProvider } from "./core";

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <CoreProvider>
    <App />
  </CoreProvider>,
);
