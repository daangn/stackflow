import React, { Suspense } from "react";

import { Stack } from "./stackflow";

const App: React.FC = () => (
  <Suspense>
    <Stack />
  </Suspense>
);

export default App;
