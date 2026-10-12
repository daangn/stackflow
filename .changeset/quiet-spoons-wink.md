---
"@stackflow/plugin-basic-ui": patch
"@stackflow/react-ui-core": patch
---

Support Core 1.x from 1.1.0 and Stackflow React 1.x from 1.3.2 in Basic UI and its React UI Core dependency, while retaining Core 2.x/3.x and Stackflow React 2.x support.

Use the legacy global navigation hook on Stackflow React 1.x so AppScreen, AppBar, Modal, and BottomSheet can pop activities on both supported React integration versions.
