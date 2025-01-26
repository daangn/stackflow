import { onMessage } from "@/message";
import type {
  DevtoolsDataKey,
  DevtoolsDataStore,
  DevtoolsMessage,
} from "@stackflow/plugin-devtools";
import { useEffect, useState } from "react";
import { browser } from "wxt/browser";

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
    const removeListener = onMessage("DATA_CHANGED", async (message) => {
      if (message.data === key) {
        const [result] = await browser.devtools.inspectedWindow.eval(
          `window.__STACKFLOW_DEVTOOLS__.data.${key}`,
        );

        if (result) {
          setData(result as DevtoolsDataStore[K]);
        }
      }
    });

    return removeListener;
  });

  return data;
}
