import type { StackflowMessage } from "@stackflow/plugin-devtools";

// From App
window.addEventListener("message", (ev) => {
  const msg: StackflowMessage = ev.data;

  switch (msg.type) {
    case "DATA_CHANGED": {
      console.log("Data is changed:", msg.payload);
      chrome.runtime.sendMessage(msg);
      break;
    }
  }
});
