import useData from "./useData";

export default function useStack() {
  const data = useData("stack", {
    activities: [],
    globalTransitionState: "idle",
    registeredActivities: [],
    transitionDuration: 300,
  });

  return data;
}
