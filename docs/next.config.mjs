import nextra from "nextra";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.jsx",
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
  typescript: {
    ignoreBuildErrors: true,
  },
});

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
