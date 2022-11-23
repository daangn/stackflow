import React, { Suspense } from "react";

import { Stack } from "./stackflow";

const App: React.FC = () => (
  <React.StrictMode>
    <Suspense>
      <Stack />
    </Suspense>
  </React.StrictMode>
);

export default App;
