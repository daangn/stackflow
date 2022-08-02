const { vanillaExtractPlugin } = require("@vanilla-extract/esbuild-plugin");

const config = ({ entryPoints = ["./src/index.ts"], outdir = "dist" }) => ({
  entryPoints,
  outdir,
  target: "es2015",
  bundle: true,
  minify: false,
  external: ["react"],
  plugins: [
    vanillaExtractPlugin({
      esbuildOptions: {
        external: ["@vanilla-extract"],
      },
    }),
  ],
  sourcemap: true,
});

module.exports = config;
