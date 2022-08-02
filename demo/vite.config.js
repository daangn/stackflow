import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "./build",
  },
  plugins: [
    react(),
    vanillaExtractPlugin({
      esbuildOptions: {
        external: ["@seed-design", "@stackflow"],
      },
    }),
  ],
});
