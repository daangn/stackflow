import { StrictMode, Suspense } from "react";

import { Stack } from "./stackflow";

const App: React.FC = () => (
  <StrictMode>
    <Suspense>
      <Stack />
    </Suspense>
  </StrictMode>
);

export default App;
