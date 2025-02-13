import { sendMessage } from "@/message";
import type { DevtoolsMessage } from "@stackflow/plugin-devtools";
import { defineContentScript } from "wxt/sandbox";

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  main() {
    // From App
    window.addEventListener("message", (ev) => {
      const msg: DevtoolsMessage = ev.data;

      switch (msg.type) {
        case "DATA_CHANGED": {
          sendMessage(msg.type, msg.payload).catch(() => {});
          break;
        }
      }
    });
  },
});
