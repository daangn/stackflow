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
  "../extensions/plugin-history-sync/docs/modules.md",
  "utf-8",
);
const pluginRenderApi = fs.readFileSync(
  "../extensions/plugin-renderer-basic/docs/modules.md",
  "utf-8",
);
const pluginUiApi = fs.readFileSync(
  "../extensions/basic-ui/docs/modules.md",
  "utf-8",
);

const escapedReactApi = escapeMdx(reactApi);
const escapedPluginHistorySyncApi = escapeMdx(pluginHistorySyncApi);
const escapedPluginRenderApi = escapeMdx(pluginRenderApi);
const escapedPluginUiApi = escapeMdx(pluginUiApi);

fs.writeFileSync(
  "./pages/api-references/react.ko.md",
  escapedReactApi,
  "utf-8",
);

fs.writeFileSync(
  "./pages/api-references/plugin-history-sync.ko.md",
  escapedPluginHistorySyncApi,
  "utf-8",
);
fs.writeFileSync(
  "./pages/api-references/plugin-renderer-basic.ko.md",
  escapedPluginRenderApi,
  "utf-8",
);
fs.writeFileSync(
  "./pages/api-references/basic-ui.ko.md",
  escapedPluginUiApi,
  "utf-8",
);
