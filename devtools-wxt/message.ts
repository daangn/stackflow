import type { DevtoolsDataKey } from "@stackflow/plugin-devtools";
import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  DATA_CHANGED(key: DevtoolsDataKey): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
