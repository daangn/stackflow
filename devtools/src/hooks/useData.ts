import {
  DevtoolsDataKey,
  DevtoolsMessage,
  DevtoolsDataStore,
} from "@stackflow/plugin-devtools";
import { useEffect, useLayoutEffect, useState } from "react";

export default function useData<K extends DevtoolsDataKey>(
  key: K,
  defaultValue: DevtoolsDataStore[K],
) {
  const [data, setData] = useState<DevtoolsDataStore[K]>(defaultValue);

  // fetch initial data
  useEffect(() => {
    chrome.devtools.inspectedWindow.eval(
      `window.__STACKFLOW_DEVTOOLS__.data.${key}`,
      (result: DevtoolsDataStore[K]) => {
        console.log("fetching initial stack", result);
        setData(result);
      },
    );
  }, []);

  // listen for data changes
  useEffect(() => {
    const listener = (message: DevtoolsMessage) => {
      if (message.type === "DATA_CHANGED" && message.payload === key) {
        chrome.devtools.inspectedWindow.eval(
          `window.__STACKFLOW_DEVTOOLS__.data.${key}`,
          (result: DevtoolsDataStore[K]) => {
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
