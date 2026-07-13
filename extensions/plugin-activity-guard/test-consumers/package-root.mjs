import {
  activityGuardPlugin,
  and,
  or,
  redirect,
} from "@stackflow/plugin-activity-guard";

for (const [name, value] of Object.entries({
  activityGuardPlugin,
  redirect,
  and,
  or,
})) {
  if (typeof value !== "function") {
    throw new Error(`Missing callable ESM export: ${name}`);
  }
}
