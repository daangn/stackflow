const { declare } = require("@babel/helper-plugin-utils");

module.exports = declare((api) => {
  api.assertVersion(7);

  return {
    presets: [
      require.resolve("@babel/preset-typescript"),
      require.resolve("@babel/preset-react"),
    ],
    env: {
      cjs: {
        presets: [
          [
            require.resolve("@babel/preset-env"),
            {
              targets: {
                node: 14,
              },
            },
          ],
        ],
      },
      esm: {
        presets: [
          [
            require.resolve("@babel/preset-env"),
            {
              modules: false,
              bugfixes: false,
              targets: {
                node: 14,
              },
            },
          ],
        ],
      },
    },
  };
});
