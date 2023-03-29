import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  name: "Stackflow Devtools",
  description: "",
  version: "0.0.0",
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
});
