import { Head, Html, Main, NextScript } from "next/document";

const SEED_SCRIPT = `
(() => {
  var e = document.documentElement;
  e.dataset.seed = "";
  var pd = window.matchMedia("(prefers-color-scheme: dark)"),
    a = () => {
      var isDark = pd.matches
      e.dataset.seedScaleColor = isDark ? "dark" : "light";

      e.classList.remove("light")
      e.classList.remove("dark")
      if (isDark) {
        e.classList.add("dark")
      } else {
        e.classList.add("light")
      }
    };
  "addEventListener" in pd
    ? pd.addEventListener("change", a)
    : "addListener" in pd && pd.addListener(a),
    a();
})();
`;

export default function Document() {
  return (
    <Html>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: SEED_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
