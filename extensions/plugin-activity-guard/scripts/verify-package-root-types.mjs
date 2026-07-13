import { execFileSync } from "node:child_process";

execFileSync(
  process.env.npm_execpath,
  [
    "exec",
    "tsc",
    "--noEmit",
    "--skipLibCheck",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "--target",
    "ESNext",
    "./test-consumers/package-root.types.ts",
  ],
  { stdio: "pipe" },
);
