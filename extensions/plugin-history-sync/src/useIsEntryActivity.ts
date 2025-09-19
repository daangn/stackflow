import { useActivity } from "@stackflow/react";

export function useIsEntryActivity(): boolean {
  const { context } = useActivity();
  return (context as any)?.isEntryActivity;
}
