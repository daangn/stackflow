import React from "react";

import * as css from "./App.css";
import { Stack } from "./stackflow";

const App: React.FC = () => (
  <div className={css.container}>
    <div className={css.centered}>
      <Stack
        context={{
          req: { path: window.location.pathname + window.location.search },
        }}
      />
    </div>
  </div>
);

export default App;
