const fs = require("fs");

function escapeMdx(str) {
  return str
    .replaceAll("<", "\\<")
    .replaceAll("{", "\\{")
    .replaceAll("modules.md", "");
}

const reactApi = fs.readFileSync(
  "../integrations/react/docs/modules.md",
  "utf-8",
);
const pluginHistorySyncApi = fs.readFileSync(
  "../plugins/history-sync/docs/modules.md",
  "utf-8",
);
const pluginRenderApi = fs.readFileSync(
  "../plugins/render/docs/modules.md",
  "utf-8",
);
const pluginUiApi = fs.readFileSync("../plugins/ui/docs/modules.md", "utf-8");

const escapedReactApi = escapeMdx(reactApi);
const escapedPluginHistorySyncApi = escapeMdx(pluginHistorySyncApi);
const escapedPluginRenderApi = escapeMdx(pluginRenderApi);
const escapedPluginUiApi = escapeMdx(pluginUiApi);

fs.writeFileSync("./pages/react-api.ko.md", escapedReactApi, "utf-8");

fs.writeFileSync(
  "./pages/common-plugins/history-sync.ko.md",
  escapedPluginHistorySyncApi,
  "utf-8",
);
fs.writeFileSync(
  "./pages/react-plugins/render.ko.md",
  escapedPluginRenderApi,
  "utf-8",
);
fs.writeFileSync("./pages/react-plugins/ui.ko.md", escapedPluginUiApi, "utf-8");
