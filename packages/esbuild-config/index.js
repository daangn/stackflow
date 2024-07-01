const { vanillaExtractPlugin } = require("@vanilla-extract/esbuild-plugin");

const config = ({
  entryPoints = ["./src/index.ts"],
  outdir = "dist",
  plugins = [],
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
    ...plugins,
  ],
});

module.exports = config;
