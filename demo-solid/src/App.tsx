import { type Component, Suspense } from "solid-js";
import { Stack } from "./stackflow";

const App: Component = () => (
  <Suspense>
    <Stack />
  </Suspense>
);

export default App;
