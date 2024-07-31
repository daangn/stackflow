import { createSignal, onMount } from "solid-js";

export function useMounted() {
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setMounted(true);
  });

  return mounted;
}
