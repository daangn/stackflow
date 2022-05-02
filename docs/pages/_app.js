import "nextra-theme-docs/style.css";

import React from "react";

// eslint-disable-next-line react/prop-types
export default function Nextra({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
