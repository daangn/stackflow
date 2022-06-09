import "./App.css";

import React from "react";

import { Stack } from "./stackflow";

const App: React.FC = () => (
  <Stack
    context={{
      req: { path: window.location.pathname + window.location.search },
    }}
  />
);

export default App;
