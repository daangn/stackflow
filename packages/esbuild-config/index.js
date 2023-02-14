const { vanillaExtractPlugin } = require("@vanilla-extract/esbuild-plugin");

const config = ({
  entryPoints = ["./src/index.ts"],
  outdir = "dist",
  vanillaExtractExternal = [],
  vanillaExtractIdentifiers = "short",
}) => ({
  entryPoints,
  outdir,
  target: "es2015",
  bundle: true,
  minify: false,
  external: ["react"],
  sourcemap: true,
  plugins: [
    vanillaExtractPlugin({
      identifiers: vanillaExtractIdentifiers,
      esbuildOptions: {
        external: ["@stackflow", ...vanillaExtractExternal],
      },
    }),
  ],
});

module.exports = config;
