import { StrictMode, Suspense } from "react";

import { Stack } from "./stackflow";
import { config } from "./stackflow/stackflow.config";

const App: React.FC = () => (
  <StrictMode>
    <Suspense>
      <Stack />
    </Suspense>
  </StrictMode>
);

console.log(JSON.stringify(config));

export default App;
