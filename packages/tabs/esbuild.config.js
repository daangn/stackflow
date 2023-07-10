const { vanillaExtractPlugin } = require('@vanilla-extract/esbuild-plugin')
const { build } = require('esbuild')
const pkg = require('./package.json')

const external = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
})

const base = ({
  entryPoints = ['./src/index.ts'],
  outdir = 'dist',
  vanillaExtractExternal = [],
  vanillaExtractIdentifiers = 'short',
}) => ({
  entryPoints,
  outdir,
  target: 'es2015',
  bundle: true,
  minify: false,
  external: ['react'],
  sourcemap: true,
  plugins: [
    vanillaExtractPlugin({
      identifiers: vanillaExtractIdentifiers,
      esbuildOptions: {
        external: vanillaExtractExternal,
      },
    }),
  ],
})

Promise.all([
  build({
    ...base({
      vanillaExtractIdentifiers: 'short',
    }),
    format: 'cjs',
    external,
  }),
  build({
    ...base({
      vanillaExtractIdentifiers: 'short',
    }),
    format: 'esm',
    outExtension: {
      '.js': '.mjs',
    },
    external,
  }),
]).catch(() => process.exit(1))
