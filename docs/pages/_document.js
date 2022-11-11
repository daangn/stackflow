import { Head, Html, Main, NextScript } from "next/document";

const SEED_SCALE_COLOR_SCRIPT = `
  (() => {var e=document.documentElement;e.dataset.seed="";var pd=window.matchMedia("(prefers-color-scheme: dark)"),a=()=>{e.dataset.seedScaleColor=pd.matches?"dark":"light"};"addEventListener"in pd?pd.addEventListener("change",a):"addListener"in pd&&pd.addListener(a),a();})()
`;

export default function Document() {
  return (
    <Html data-stackflow-plugin-basic-ui-theme="cupertino">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: SEED_SCALE_COLOR_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
