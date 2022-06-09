import React from "react";

import * as css from "./App.css";
import { Stack } from "./stackflow";

const App: React.FC = () => (
  <div className={css.container}>
    <Stack
      context={{
        req: { path: window.location.pathname + window.location.search },
      }}
    />
  </div>
);

export default App;
