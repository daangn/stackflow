import { StrictMode, Suspense } from "react";

import { Stack } from "./stackflow";

const App = () => (
  <StrictMode>
    <Suspense>
      <Stack />
    </Suspense>
  </StrictMode>
);

export default App;
