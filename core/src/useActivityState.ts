export type ActivityState = {
  transitionStatus:
    | "enter-active"
    | "enter-done"
    | "exit-active"
    | "exit-done"
    | "%other";
};

export function useActivityState(): ActivityState {
  return {
    transitionStatus: "enter-active",
  };
}
