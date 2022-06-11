const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.js",
  // optional: add `unstable_staticImage: true` to enable Nextra's auto image import
});

module.exports = withNextra({
  eslint: {
    ignoreDuringBuilds: true,
  },
  i18n: {
    locales: ["ko"],
    defaultLocale: "ko",
  },
});
