import { LinkUrlResolverProvider } from "@stackflow/link";
import { StrictMode, Suspense } from "react";

import { historySync, Stack } from "./stackflow";

const App: React.FC = () => (
  <StrictMode>
    <Suspense>
      <LinkUrlResolverProvider resolver={historySync.urlResolver}>
        <Stack />
      </LinkUrlResolverProvider>
    </Suspense>
  </StrictMode>
);

export default App;
