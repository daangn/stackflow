export default {
  projectLink: "https://github.com/daangn/stackflow",
  docsRepositoryBase: "https://github.com/daangn/stackflow",
  titleSuffix: " - Stackflow",
  defaultMenuCollapsed: false,
  nextLinks: true,
  prevLinks: true,
  search: true,
  // unstable_flexsearch: true,
  customSearch: null,
  darkMode: true,
  footer: true,
  footerText: `MIT ${new Date().getFullYear()} © Stackflow`,
  footerEditLink: false,
  logo: <img src="/logo.svg" alt="Stackflow" />,
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="Mobile-first stack navigator framework with Composable Plugin System (supports iOS/Android WebView, React Native and also Desktop environment)"
      />
      <meta name="og:title" content="stackflow" />
    </>
  ),
  i18n: [
    { locale: "en", text: "English" },
    { locale: "ko", text: "한국어" },
  ],
};
