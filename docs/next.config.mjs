import nextra from "nextra";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

export default withNextra({
  images: {
    unoptimized: true,
  },
  i18n: {
    locales: ["en", "ko"],
    defaultLocale: "en",
    localeDetection: false,
  },
});
