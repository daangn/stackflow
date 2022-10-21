import "nextra-theme-docs/style.css";
import "@stackflow/demo/stackflow.css";
import "@stackflow/plugin-basic-ui/index.css";
import "@seed-design/stylesheet/global.css";
import "react-lazy-load-image-component/src/effects/opacity.css";
import "simple-reveal/index.css";
import "../styles/global.css";

import React from "react";

// eslint-disable-next-line react/prop-types
export default function Nextra({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
