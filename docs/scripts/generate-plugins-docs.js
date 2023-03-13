/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const extensionsFolderPath = "../extensions";
const pluginsFolderPath = "./pages/plugins";

const githubBaseUrl = "https://github.com/daangn/stackflow";
const extensionsPathUrl = `${githubBaseUrl}/tree/main/extensions`;

console.log("Generate plugins docs start");

fs.readdir(extensionsFolderPath, (err, files) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  if (!fs.existsSync(pluginsFolderPath)) {
    fs.mkdirSync(pluginsFolderPath);
  }

  // -> write to docs/pages/plugins/meta.ko.json
  fs.writeFileSync(
    path.resolve(pluginsFolderPath, "_meta.json"),
    `{\n${files.map((file) => `  "${file}": "${file}"`).join(",\n")}\n}\n`,
  );

  files.forEach((file) => {
    const pluginFolderPath = path.join(extensionsFolderPath, file);
    if (fs.statSync(pluginFolderPath).isDirectory()) {
      const readmeFilePath = path.join(pluginFolderPath, "README.md");
      fs.readFile(readmeFilePath, "utf8", (err, data) => {
        if (err) {
          console.log(err);
          process.exit(1);
        }

        // -> write to docs/pages/plugins/${file}.ko.mdx
        fs.writeFileSync(
          path.resolve(pluginsFolderPath, `${file}.mdx`),
          `${data}\n- [plugin github link](${extensionsPathUrl}/${file})\n`,
        );
      });
    }
  });
});

console.log("Generate plugins docs success!");
