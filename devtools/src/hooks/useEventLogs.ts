import useData from "./useData";

export default function useEventLogs() {
  const data = useData("eventLogs", []);
  return data;
}
