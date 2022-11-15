import { Head, Html, Main, NextScript } from "next/document";

const SEED_SCALE_COLOR_SCRIPT = `(() => { var e=document.documentElement;var pd=window.matchMedia("(prefers-color-scheme: dark)"),a= () => { e.dataset.seed="";e.dataset.seedScaleColor=pd.matches?"dark":"light";};"addEventListener"in pd?pd.addEventListener("change",a):"addListener"in pd&&pd.addListener(a),a();})()`;
const NEXTRA_THEME_SCRIPT = `(() => { var e=document.documentElement;var pd=window.matchMedia("(prefers-color-scheme: dark)"),a= () => { e.classList.remove("light");e.classList.remove("dark");pd.matches ? e.classList.add("dark") : e.classList.add("light");};"addEventListener"in pd?pd.addEventListener("change",a):"addListener"in pd&&pd.addListener(a),a();})()`;

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
