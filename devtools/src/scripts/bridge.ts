import type { DevtoolsMessage } from "@stackflow/plugin-devtools";

// From App
window.addEventListener("message", (ev) => {
  const msg: DevtoolsMessage = ev.data;

  switch (msg.type) {
    case "DATA_CHANGED": {
      chrome.runtime.sendMessage(msg).catch(() => {});
      break;
    }
  }
});
