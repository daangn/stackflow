import { defineManifest } from "@crxjs/vite-plugin";

import { version } from "../package.json";

export default defineManifest({
  name: "Stackflow Devtools",
  description: "Devtools for Stackflow Apps",
  version,
  manifest_version: 3,
  action: {
    default_popup: "index.html",
  },
  devtools_page: "src/pages/devtools.html",
  content_scripts: [
    {
      matches: ["https://*/*", "http://*/*"],
      js: ["src/scripts/bridge.ts"],
    },
  ],
  permissions: ["clipboardWrite"],
});
