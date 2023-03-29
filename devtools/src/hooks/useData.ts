import {
  StackflowDataKey,
  StackflowMessage,
  StackflowData,
} from "@stackflow/plugin-devtools";
import { useEffect, useLayoutEffect, useState } from "react";

export default function useData<K extends StackflowDataKey>(
  key: K,
  defaultValue: StackflowData[K],
) {
  const [data, setData] = useState<StackflowData[K]>(defaultValue);

  // fetch initial data
  useEffect(() => {
    chrome.devtools.inspectedWindow.eval(
      `window.__STACKFLOW_DEVTOOLS__.data.${key}`,
      (result: StackflowData[K]) => {
        console.log("fetching initial stack", result);
        setData(result);
      },
    );
  }, []);

  // listen for data changes
  useEffect(() => {
    const listener = (message: StackflowMessage) => {
      if (message.type === "DATA_CHANGED" && message.payload === key) {
        chrome.devtools.inspectedWindow.eval(
          `window.__STACKFLOW_DEVTOOLS__.data.${key}`,
          (result: StackflowData[K]) => {
            setData(result);
          },
        );
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  });

  return data;
}
