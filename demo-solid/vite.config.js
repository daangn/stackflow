import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  build: {
    outDir: "./build",
  },
  plugins: [
    solid(),
    vanillaExtractPlugin({
      viteConfigOverrides: {
        plugins: [],
      },
    }),
  ],
});
