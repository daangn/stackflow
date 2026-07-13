const api = require("@stackflow/plugin-activity-guard");

for (const name of ["activityGuardPlugin", "redirect", "and", "or"]) {
  if (typeof api[name] !== "function") {
    throw new Error(`Missing callable CommonJS export: ${name}`);
  }
}
