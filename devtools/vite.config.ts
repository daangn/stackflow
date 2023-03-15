import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest";
import { launch } from "chrome-launcher";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

const DEMO_PORT = 5174;

let demoProcess: ChildProcessWithoutNullStreams;

const exit = () => {
  if (demoProcess) {
    process.kill(-demoProcess.pid);
  }
  process.exit();
};

process.on("exit", exit);
process.on("SIGINT", exit);
process.on("SIGTERM", exit);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vanillaExtractPlugin(),
    crx({
      manifest,
    }),
    {
      name: "Launch chrome with extension",
      apply: "serve",
      configureServer(server) {
        if (demoProcess) {
          process.kill(-demoProcess.pid);
        }

        demoProcess = spawn(
          "yarn",
          [
            "workspace",
            "@stackflow/demo",
            "dev:app",
            "--port",
            `${DEMO_PORT.toString()}`,
            "--strictPort",
          ],
          {
            cwd: __dirname,
            detached: true,
          },
        );
        demoProcess.stdout.on("data", (chunk) => {
          const msg = chunk.toString();

          if (msg.includes("ready in")) {
            console.log("Demo is ready! Launching chrome...");

            launch({
              startingUrl: `http://localhost:${DEMO_PORT}`,
              chromeFlags: [
                `--load-extension=${__dirname}/dist`,
                "--disable-extensions-except=dist",
                "--auto-open-devtools-for-tabs",
              ],
            });
          }
        });
      },
    },
  ],
});
