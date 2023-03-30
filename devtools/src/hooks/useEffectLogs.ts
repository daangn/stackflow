import useData from "./useData";

export default function useEffectLogs() {
  const data = useData("effectLogs", []);
  return data;
}
