import { useNullableActivity } from "./useNullableActivity";

export function useZIndexBase() {
  const activity = useNullableActivity();
  return (activity?.zIndex ?? 0) * 5;
}
