const { vanillaExtractPlugin } = require("@vanilla-extract/esbuild-plugin");

const config = ({
  entryPoints = ["./src/index.ts"],
  outdir = "dist",
  vanillaExtractExternal = [],
}) => ({
  entryPoints,
  outdir,
  target: "es2015",
  bundle: true,
  minify: false,
  external: ["react"],
  plugins: [
    vanillaExtractPlugin({
      esbuildOptions: {
        external: ["@stackflow", ...vanillaExtractExternal],
      },
    }),
  ],
  sourcemap: true,
});

module.exports = config;
