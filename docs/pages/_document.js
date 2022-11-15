import { Head, Html, Main, NextScript } from "next/document";

const SEED_SCALE_COLOR_SCRIPT = `(()=>{var e=document.documentElement,d=window.matchMedia("(prefers-color-scheme: dark)"),a=()=>{e.dataset.seed="",e.dataset.seedScaleColor=d.matches?"dark":"light"};"addEventListener"in d?d.addEventListener("change",a):"addListener"in d&&d.addListener(a),a()})();`;
const NEXTRA_THEME_SCRIPT = `(()=>{var e=document.documentElement,d=window.matchMedia("(prefers-color-scheme: dark)"),s=()=>{e.classList.remove("light"),e.classList.remove("dark"),d.matches?e.classList.add("dark"):e.classList.add("light")};"addEventListener"in d?d.addEventListener("change",s):"addListener"in d&&d.addListener(s),s()})();`;

export default function Document() {
  return (
    <Html data-stackflow-plugin-basic-ui-theme="cupertino">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: SEED_SCALE_COLOR_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: NEXTRA_THEME_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
